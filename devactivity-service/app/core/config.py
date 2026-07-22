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
    APP_ENV: str = "production"
    SERVICE_NAME: str = "devactivity-service"
    VICTORIALOGS_URL: str = ""

    # 로컬 개발 전용 JWT 우회 (default false, development 밖에서는 기동 거부)
    AUTH_DEV_BYPASS: bool = False

    # CORS 허용 origin (와일드카드 금지 — 명시 목록)
    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

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
        env_file=f".env.{os.getenv('APP_ENV', 'production')}",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _require_jwt_secret_outside_dev(self) -> "Settings":
        # 비-dev 에서 빈 JWT_SECRET 으로 기동 금지 (추측 가능한 비밀로 인증이 서는 것 방지 — fail-fast)
        if self.APP_ENV != "development" and not self.JWT_SECRET:
            raise ValueError("JWT_SECRET 이 비어 있습니다 (frontend·backend 와 동일값 필요).")
        return self

    @model_validator(mode="after")
    def _forbid_dev_bypass_outside_dev(self) -> "Settings":
        # AUTH_DEV_BYPASS 는 development 에서만 — 비-dev 기동 시 fail-fast (인증 우회가 프로덕션에 서는 것 방지)
        if self.AUTH_DEV_BYPASS and self.APP_ENV != "development":
            raise ValueError("AUTH_DEV_BYPASS 는 development 환경에서만 허용됩니다.")
        return self


settings = Settings()
