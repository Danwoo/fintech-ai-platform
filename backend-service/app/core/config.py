import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "backend-service"

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
        env_file=f".env.{os.getenv('APP_ENV', 'development')}",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
