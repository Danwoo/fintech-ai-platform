"""워크스페이스 문서 청크 벡터 스토어(pgvector) 접근 — thin SQL wrapper (파라미터 바인딩만, 비즈니스 로직 없음).

async SQLAlchemy Core(text()) + asyncpg. 벡터값은 pgvector 텍스트 리터럴로 바인딩하고 SQL 에서 ::vector 로
캐스팅한다(사용자 입력이 아닌 임베딩 float 배열 — 인젝션 표면 아님).

테넌트 격리(fail-closed): search/delete 는 company_id 가 없으면 쿼리 자체를 거부한다 — 앱 필터가 아니라
데이터 접근 계층에서 강제해 격리 사고의 폭발 반경을 줄인다(design-160 §4.2).
"""

from __future__ import annotations

from core.exceptions import UnauthorizedError
from pgvector import Vector
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

# 삽입 컬럼 — reg_dt 는 DEFAULT now() 로 서버가 채운다. (workspace_doc_chunk 스키마 SoT: pgvector-delta §2)
_INSERT_COLUMNS = [
    "company_id",
    "user_id",
    "atch_file_id",
    "file_sn",
    "file_nm",
    "page",
    "chunk_idx",
    "header_chain",
    "source",
    "text",
]
_SEARCH_COLUMNS = ["text", "file_nm", "page", "chunk_idx", "header_chain"]


class WorkspaceChunkRepository:
    def __init__(self, engine: AsyncEngine | None, table: str = "workspace_doc_chunk", embedding_dim: int = 1024):
        self.engine = engine
        self.table = table  # config 상수 (신뢰) — 식별자 인터폴레이션 대상, 사용자 입력 아님
        self.embedding_dim = embedding_dim

    def _require_engine(self) -> AsyncEngine:
        if self.engine is None:
            raise ConnectionError("워크스페이스 벡터DB(pg)에 연결할 수 없습니다.")
        return self.engine

    async def ensure_table(self) -> None:
        """벡터 확장·테이블·인덱스를 멱등 생성 (IF NOT EXISTS). 인제스트 흐름의 색인 직전에 호출."""
        engine = self._require_engine()
        ddl = [
            "CREATE EXTENSION IF NOT EXISTS vector",
            f"""CREATE TABLE IF NOT EXISTS {self.table} (
                  id            BIGSERIAL PRIMARY KEY,
                  company_id    BIGINT      NOT NULL,
                  user_id       TEXT        NOT NULL,
                  atch_file_id  VARCHAR(20) NOT NULL,
                  file_sn       INT,
                  file_nm       TEXT        NOT NULL,
                  page          INT,
                  chunk_idx     INT         NOT NULL,
                  header_chain  TEXT,
                  source        VARCHAR(10) NOT NULL DEFAULT 'html',
                  text          TEXT        NOT NULL,
                  embedding     vector({self.embedding_dim}) NOT NULL,
                  reg_dt        TIMESTAMPTZ DEFAULT now()
                )""",
            f"CREATE INDEX IF NOT EXISTS ix_wdc_company ON {self.table} (company_id)",
            f"CREATE INDEX IF NOT EXISTS ix_wdc_file ON {self.table} (atch_file_id)",
            f"CREATE INDEX IF NOT EXISTS ix_wdc_embed ON {self.table} USING hnsw (embedding vector_cosine_ops)",
        ]
        async with engine.begin() as conn:
            for statement in ddl:
                await conn.execute(text(statement))

    async def insert_chunks(self, rows: list[dict]) -> int:
        """청크 배치 INSERT. rows 각 dict 는 _INSERT_COLUMNS + embedding(list[float]). 반환: 삽입 건수."""
        engine = self._require_engine()
        if not rows:
            return 0
        columns = [*_INSERT_COLUMNS, "embedding"]
        placeholders = ", ".join(f":{c}" if c != "embedding" else "CAST(:embedding AS vector)" for c in columns)
        sql = f"INSERT INTO {self.table} ({', '.join(columns)}) VALUES ({placeholders})"
        params = [
            {**{c: row.get(c) for c in _INSERT_COLUMNS}, "embedding": Vector(row["embedding"]).to_text()}
            for row in rows
        ]
        async with engine.begin() as conn:
            await conn.execute(text(sql), params)
        return len(params)

    async def delete_by_file(self, atch_file_id: str, company_id: int | None) -> int:
        """파일(첨부 그룹) 단위 청크 회수. company_id 없으면 fail-closed. 반환: 삭제 건수."""
        if company_id is None:
            raise UnauthorizedError()
        engine = self._require_engine()
        sql = f"DELETE FROM {self.table} WHERE atch_file_id = :atch_file_id AND company_id = :company_id"
        async with engine.begin() as conn:
            result = await conn.execute(text(sql), {"atch_file_id": atch_file_id, "company_id": company_id})
        return result.rowcount

    async def search_dense(self, company_id: int | None, query_vec: list[float], k: int) -> list[dict]:
        """company_id 스코프 내 cosine 최근접 k 검색 (<=> = cosine distance). company_id 없으면 fail-closed."""
        if company_id is None:
            raise UnauthorizedError()
        engine = self._require_engine()
        sql = (
            f"SELECT {', '.join(_SEARCH_COLUMNS)}, embedding <=> CAST(:qvec AS vector) AS distance "
            f"FROM {self.table} WHERE company_id = :company_id "
            "ORDER BY embedding <=> CAST(:qvec AS vector) LIMIT :k"
        )
        params = {"qvec": Vector(query_vec).to_text(), "company_id": company_id, "k": k}
        async with engine.connect() as conn:
            result = await conn.execute(text(sql), params)
            return [dict(row) for row in result.mappings().all()]
