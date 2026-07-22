import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "production"
    SERVICE_NAME: str = "fullstack-file"

    # 로컬 개발 전용 JWT 우회 (default false, development 밖에서는 기동 거부)
    AUTH_DEV_BYPASS: bool = False

    # CORS 허용 origin (와일드카드 금지 — 명시 목록)
    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

    # SQL 서버 설정
    FILE_SQL_DB_DRIVER: str
    FILE_SQL_DB_ODBC_DRIVER: str
    FILE_SQL_DB_HOST: str
    FILE_SQL_DB_PORT: int
    FILE_SQL_DB_NAME: str
    FILE_SQL_DB_USER: str
    FILE_SQL_DB_PASSWORD: str

    # SFTP 서버 설정
    SFTP_HOST: str
    SFTP_PORT: int
    SFTP_USERNAME: str
    SFTP_PASSWORD: str
    SFTP_BASE_PATH: str = "/upload"

    JWT_SECRET: str

    VICTORIALOGS_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('APP_ENV', 'production')}",
        env_file_encoding="utf-8",
    )

    @model_validator(mode="after")
    def _forbid_dev_bypass_outside_dev(self) -> "Settings":
        # AUTH_DEV_BYPASS 는 development 에서만 — 비-dev 기동 시 fail-fast (인증 우회가 프로덕션에 서는 것 방지)
        if self.AUTH_DEV_BYPASS and self.APP_ENV != "development":
            raise ValueError("AUTH_DEV_BYPASS 는 development 환경에서만 허용됩니다.")
        return self


settings = Settings()
