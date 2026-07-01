import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "doc-search-mcp-service"
    VICTORIALOGS_URL: str = ""

    # 인증 — frontend·backend·devactivity 와 동일 JWT_SECRET (사용자/에이전트 JWT + 서비스 토큰 검증)
    JWT_SECRET: str = ""

    # false(기본): Milvus/Redis/임베딩/리랭커 없이 in-memory MOCK 금융 문서로 동작. true: 실 인프라 사용
    USE_REAL_API: bool = False

    # Hybrid Topic Vector Search (USE_REAL_API=true 일 때만 사용)
    MILVUS_DB_HOST: str = ""
    MILVUS_DB_TOKEN: str = ""
    MILVUS_DB_NAME: str = "finance_doc_topic"
    REDIS_DB_HOST: str = ""
    REDIS_DB_PORT: int = 6379
    REDIS_DB_PASSWORD: str = ""
    OPENAI_EMBEDDING_URL: str = ""
    OPENAI_EMBEDDING_MODEL_NAME: str = "BAAI/bge-m3"
    OPENAI_EMBEDDING_API_KEY: str = "EMPTY"
    OPENAI_RERANKER_URL: str = ""
    OPENAI_RERANKER_MODEL_NAME: str = "BAAI/bge-reranker-v2-m3"
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('APP_ENV', 'development')}",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _require_jwt_secret_outside_dev(self) -> "Settings":
        # 비-dev 에서 빈 JWT_SECRET 으로 기동 금지 (추측 가능한 비밀로 인증이 서는 것 방지 — fail-fast)
        if self.APP_ENV != "development" and not self.JWT_SECRET:
            raise ValueError("JWT_SECRET 이 비어 있습니다 (frontend·backend 와 동일값 필요).")
        return self


settings = Settings()
