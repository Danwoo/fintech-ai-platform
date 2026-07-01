import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "production"
    SERVICE_NAME: str = "backend-service"

    # 로컬 개발 전용 JWT 우회 (default false, development 밖에서는 기동 거부)
    AUTH_DEV_BYPASS: bool = False

    # CORS 허용 origin (와일드카드 금지 — 명시 목록)
    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

    # SQL 서버 설정
    BACKEND_SQL_DB_DRIVER: str
    BACKEND_SQL_DB_ODBC_DRIVER: str
    BACKEND_SQL_DB_HOST: str
    BACKEND_SQL_DB_PORT: int
    BACKEND_SQL_DB_NAME: str
    BACKEND_SQL_DB_USER: str
    BACKEND_SQL_DB_PASSWORD: str

    # file-service
    SFTP_BASE_PATH: str = "/upload"
    FILE_SERVICE_URL: str = "http://localhost:8100"

    JWT_SECRET: str

    VICTORIALOGS_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('APP_ENV', 'production')}",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _forbid_dev_bypass_outside_dev(self) -> "Settings":
        # AUTH_DEV_BYPASS 는 development 에서만 — 비-dev 기동 시 fail-fast (인증 우회가 프로덕션에 서는 것 방지)
        if self.AUTH_DEV_BYPASS and self.APP_ENV != "development":
            raise ValueError("AUTH_DEV_BYPASS 는 development 환경에서만 허용됩니다.")
        return self


settings = Settings()
