import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "fullstack-web-mcp"
    VICTORIALOGS_URL: str = ""

    # 인증 — frontend·backend·devactivity 와 동일 JWT_SECRET (사용자/에이전트 JWT + 서비스 토큰 검증)
    JWT_SECRET: str = ""

    # Tavily Web Search API
    TAVILY_API_KEY: str = ""  # Tavily API 키

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
