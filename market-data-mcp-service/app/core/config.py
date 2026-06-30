import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SERVICE_NAME: str = "fullstack-market-data-mcp"
    VICTORIALOGS_URL: str = ""

    # 인증 — frontend·backend·multi-agent 와 동일 JWT_SECRET (사용자/에이전트 JWT + 서비스 토큰 검증)
    JWT_SECRET: str = ""

    # 시세 벤더 — 기본은 MOCK(인메모리 픽스처)라 키 없이 동작. USE_REAL_API=true 일 때만 실 벤더 호출 (선택).
    USE_REAL_API: bool = False
    MARKET_API_URL: str = "https://api.example-market-vendor.com/v1"
    MARKET_API_KEY: str = ""

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

    @model_validator(mode="after")
    def _require_market_key_when_real_api(self) -> "Settings":
        # 실 벤더 모드는 키 필수 — 키 없이 USE_REAL_API 만 켜는 잘못된 구성 fail-fast (mock 경로는 키 불필요)
        if self.USE_REAL_API and not self.MARKET_API_KEY:
            raise ValueError("USE_REAL_API=true 인데 MARKET_API_KEY 가 비어 있습니다 (mock 모드는 USE_REAL_API=false).")
        return self


settings = Settings()
