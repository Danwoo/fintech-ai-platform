import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "fullstack-file"

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
        env_file=f".env.{os.getenv('APP_ENV', 'development')}",
        env_file_encoding="utf-8",
    )


settings = Settings()
