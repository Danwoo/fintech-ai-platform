import os

from pydantic import BaseModel
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


settings = Settings()
