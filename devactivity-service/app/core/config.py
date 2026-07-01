import os

from pydantic import BaseModel, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class McpServer(BaseModel):
    """MCP 서버 연결정보."""

    name: str
    url: str
    path: str = "/mcp"
    enabled: bool = True


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "devactivity-service"
    VICTORIALOGS_URL: str = ""

    # 인증
    JWT_SECRET: str = ""

    # SQL (TN_Scheduler, TN_SchedulerMember)
    DEVACTIVITY_SQL_DB_DRIVER: str
    DEVACTIVITY_SQL_DB_ODBC_DRIVER: str
    DEVACTIVITY_SQL_DB_HOST: str
    DEVACTIVITY_SQL_DB_PORT: int
    DEVACTIVITY_SQL_DB_NAME: str
    DEVACTIVITY_SQL_DB_USER: str
    DEVACTIVITY_SQL_DB_PASSWORD: str

    # MCP 서버 (비면 portfolio-mcp-service 등록 안됨)
    MCP_SERVERS: list[McpServer] = []

    # LLM
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = ""
    LLM_API_KEY: str = "EMPTY"

    # SMTP
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 465
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""

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
