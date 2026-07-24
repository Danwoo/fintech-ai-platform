"""워크스페이스(사용자 업로드) 문서 — 검색 MCP tool 1개 + 내부 인제스트 엔드포인트 1개.

- `/topic-workspace` (operation_id 有): MCP tool. 챗이 근거로 쓴다. 출력은 기존 TopicSearchOut 재사용 →
  근거 추출(_extract_doc)·게이팅이 무변경. company_id 는 on-behalf JWT 에서 읽어 테넌트 스코프를 강제한다.
- `/ingest` (operation_id 無): MCP tool 로 노출하지 않는다(main.py route_maps 가 EXCLUDE). 프롬프트 인젝션으로
  LLM 이 근거 코퍼스를 오염시키는 것을 막기 위해 쓰기 능력은 REST 내부(서비스 토큰) 전용으로 둔다(design-160 AD-1).
"""

from core.auth_context import get_company_id
from core.container import Container
from core.security import verify_access_token
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, Form, UploadFile
from schemas.vector_search.vector_search_schema import TopicSearchIn, TopicSearchOut
from schemas.workspace.workspace_schema import IngestOut
from services.workspace.workspace_service import WorkspaceService
from utils.common.few_shot import few_shot

router = APIRouter(prefix="/doc-search", dependencies=[Depends(verify_access_token)])


@router.post(
    "/topic-workspace",
    operation_id="doc_search_topic_workspace",
    openapi_extra=few_shot([{"질문": "내가 올린 리포트에서 목표주가 근거", "호출": {"query": "목표주가 산정 근거"}}]),
)
@inject
async def topic_search_workspace(
    body: TopicSearchIn,
    workspace_service: WorkspaceService = Depends(Provide[Container.workspace_service]),
) -> TopicSearchOut:
    """내 워크스페이스(사용자 업로드) 문서 텍스트 검색 (pgvector dense 최근접). 사용자가 올린 리포트·문서를 청크로 색인한 개인/회사 전용 코퍼스에서 관련 청크를 반환한다 — 큐레이션 공용 자료가 아니라 요청자 회사(company_id)로 격리된 자료다. data[].text(청크 본문)·file_nm(원본 파일명, 출처 표시)·header_chain 으로 근거를 제시하라. score 는 cosine 유사도(1 에 가까울수록 관련). 결과가 0건이거나 score 가 낮으면 지어내지 말고 근거 없음을 밝혀라. 수치는 업로드 원문에 근거할 때만 인용한다."""
    return await workspace_service.search_topic(body, get_company_id())


@router.post("/ingest")
@inject
async def ingest_document(
    file: UploadFile = File(description="원본 문서 파일 (pdf/txt/md)"),
    company_id: int = Form(description="테넌트 회사 ID"),
    user_id: str = Form(description="업로더 사용자 ID"),
    atch_file_id: str = Form(description="file-service 첨부 그룹 ID"),
    file_sn: int = Form(description="첨부 그룹 내 파일 순번"),
    doc_title: str = Form(description="원본 파일명 (근거 표시명 = file_nm)"),
    workspace_service: WorkspaceService = Depends(Provide[Container.workspace_service]),
) -> IngestOut:
    """내부 전용 — 문서 bytes 를 받아 파싱·청킹·임베딩 후 pgvector 에 색인. 서비스 토큰 검증만(role/company 게이트 없음).

    MCP tool 아님(operation_id 없음 + main.py route_maps EXCLUDE). backend 오케스트레이터만 호출한다.
    """
    file_bytes = await file.read()
    return await workspace_service.ingest(
        file_bytes=file_bytes,
        filename=file.filename or doc_title,
        company_id=company_id,
        user_id=user_id,
        atch_file_id=atch_file_id,
        file_sn=file_sn,
        doc_title=doc_title,
    )
