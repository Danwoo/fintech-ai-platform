"""워크스페이스 문서 인제스트·검색 오케스트레이션 — parse→chunk→embed→pgvector 색인, 그리고 dense 검색.

USE_REAL_API=false(기본)면 pg·임베딩 없이 단독 동작한다:
- 인제스트: 파서·청킹(오프라인 동작)까지 수행하고 pg 색인은 건너뛰어 청크 수를 리포트한다.
- 검색: MOCK 금융 문서 스냅샷을 반환한다(mock_data).

테넌트 격리(fail-closed): 실검색 경로는 company_id 가 없으면 어떤 임베딩·쿼리도 하기 전에 거부한다.
인제스트/임베딩 블로킹은 run_in_threadpool 로 오프로드한다(anti-pattern 13).
"""

from clients.embedding.embedding_client import EmbeddingClient
from clients.parser.parser import ParsedDoc
from core.exceptions import UnauthorizedError
from fastapi.concurrency import run_in_threadpool
from repositories.workspace.workspace_chunk_repository import WorkspaceChunkRepository
from schemas.vector_search.vector_search_schema import TopicSearchIn, TopicSearchItem, TopicSearchOut
from schemas.workspace.workspace_schema import IngestOut
from utils.ingest.chunking import Chunk, chunk_pages
from utils.vector_search.mock_data import mock_topic_out

_WORKSPACE_COLLECTION = "topic_workspace"  # MOCK 픽스처 조회 키 (기본 픽스처로 폴백)
_TEXT_PREVIEW_CHARS = 800


class WorkspaceService:
    def __init__(
        self,
        workspace_repository: WorkspaceChunkRepository,
        embedding_client: EmbeddingClient,
        parser,
        use_real_api: bool = False,
    ):
        self.repository = workspace_repository
        self.embedding = embedding_client
        self.parser = parser
        self.use_real_api = use_real_api

    async def ingest(
        self,
        *,
        file_bytes: bytes,
        filename: str,
        company_id: int,
        user_id: str,
        atch_file_id: str,
        file_sn: int,
        doc_title: str,
    ) -> IngestOut:
        # 파싱(블로킹)·청킹(CPU) 오프로드 — 이벤트 루프 보호
        parsed: ParsedDoc = await run_in_threadpool(self.parser.parse, file_bytes, filename)
        chunks: list[Chunk] = await run_in_threadpool(chunk_pages, [(page.page_no, page.text) for page in parsed.pages])
        if not chunks:
            # 텍스트 추출 0건(스캔 PDF·빈 문서) — "indexed" 와 구분해 호출자(슬라이스 B)가
            # 추출 실패(구조 파서 필요)를 색인 성공과 오인하지 않게 한다.
            return IngestOut(job_ref=atch_file_id, chunk_count=0, status="empty")

        if not self.use_real_api:
            # MOCK: 임베딩·pg 없이 파싱/청킹 결과만 리포트 (단독 동작)
            return IngestOut(job_ref=atch_file_id, chunk_count=len(chunks), status="indexed")

        embeddings = await self.embedding.embed_documents([chunk.text for chunk in chunks])
        rows = [
            {
                "company_id": company_id,
                "user_id": user_id,
                "atch_file_id": atch_file_id,
                "file_sn": file_sn,
                "file_nm": doc_title,
                "page": chunk.page,
                "chunk_idx": chunk.chunk_idx,
                "header_chain": None,
                "source": "html",
                "text": chunk.text,
                "embedding": embedding,
            }
            for chunk, embedding in zip(chunks, embeddings, strict=True)
        ]
        await self.repository.ensure_table()
        await self.repository.insert_chunks(rows)
        return IngestOut(job_ref=atch_file_id, chunk_count=len(rows), status="indexed")

    async def search_topic(self, params: TopicSearchIn, company_id: int | None) -> TopicSearchOut:
        if not self.use_real_api:
            return mock_topic_out(_WORKSPACE_COLLECTION, params.source, params.top_k)
        if company_id is None:  # fail-closed — 어떤 작업 전에도 테넌트 스코프 없으면 거부
            raise UnauthorizedError()
        query_vec = await self.embedding.embed_query(params.query)
        hits = await self.repository.search_dense(company_id, query_vec, params.top_k)
        items = [self._to_topic_item(hit) for hit in hits]
        return TopicSearchOut(data=items, total_count=len(items))

    @staticmethod
    def _to_topic_item(hit: dict) -> TopicSearchItem:
        # cosine distance(<=>, 0~2) → 유사도(1 - distance). 챗 근거는 기존 TopicSearchOut 형태 그대로.
        similarity = round(1.0 - float(hit.get("distance") or 0.0), 4)
        return TopicSearchItem(
            score=similarity,
            rerank=None,
            hybrid=similarity,
            dense=similarity,
            doc_sparse_score=0.0,
            meta_sparse_score=0.0,
            source="html",
            file_nm=hit.get("file_nm"),
            header_chain=hit.get("header_chain"),
            text=(hit.get("text") or "")[:_TEXT_PREVIEW_CHARS],
        )
