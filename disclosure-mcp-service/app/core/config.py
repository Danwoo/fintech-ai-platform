import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "fullstack-disclosure-mcp"
    VICTORIALOGS_URL: str = ""

    # 인증 — frontend·backend·devactivity 와 동일 JWT_SECRET (사용자/에이전트 JWT + 서비스 토큰 검증)
    JWT_SECRET: str = ""

    # 실데이터 토글 — 기본 false 면 API 키 없이 in-memory mock 공시/재무 데이터로 동작.
    # true 로 켤 때만 아래 DART API 키가 필요 (없으면 mock 으로 자동 폴백).
    USE_REAL_API: bool = False

    # DART 전자공시 OpenAPI (opendart.fss.or.kr) — USE_REAL_API=true 일 때만 사용
    DISCLOSURE_API_BASE_URL: str = "https://opendart.fss.or.kr/api"
    DISCLOSURE_API_KEY: str = ""  # DART crtfc_key

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
