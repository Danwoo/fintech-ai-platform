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

    # 업로드 파일당 최대 크기 (MB) — 초과 시 413. 정본 판정은 파싱 후 실측 검사(FileService.upload_files).
    MAX_UPLOAD_SIZE_MB: int = 20

    # 요청 바디(멀티파트 전체) 남용 차단선 (MB). 파일당 한도가 아니라 "이 이상은 정상 사용이 아니다"의 상한이다.
    # 20MB 파일 25개(=최대 배치의 5배)까지 통과하므로 정상 다중파일 배치는 막지 않고, 리버스 프록시가 허용하는
    # 2g 급 요청만 파싱 전에 잘라 대역폭·temp 디스크 소모를 막는다 (#109).
    MAX_REQUEST_BODY_SIZE_MB: int = 512

    # 한 요청에 올릴 수 있는 파일 개수 남용 차단선. 파일당 크기 한도(MAX_UPLOAD_SIZE_MB)와 독립적으로,
    # 작은 파일 수천 개가 바디 상한(MAX_REQUEST_BODY_SIZE_MB) 아래로 통과해 파싱·SFTP 비용을 개수만큼
    # 무는 것을 막는다 (#144). 프론트 UI 배치 상한(maxFileCount 5·3)의 20배로 잡아 정상 다중파일 배치는
    # 절대 막지 않고 수천 개 남용만 차단한다 — 바디 크기 검사와 상호보완(큰 파일은 바디 상한, 작은 파일은 개수 상한).
    MAX_UPLOAD_FILES: int = 100

    JWT_SECRET: str

    VICTORIALOGS_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('APP_ENV', 'production')}",
        env_file_encoding="utf-8",
    )

    @property
    def max_upload_bytes(self) -> int:
        """업로드 파일당 최대 크기(바이트). MAX_UPLOAD_SIZE_MB 를 단일 소스로 파생 — MB→bytes 변환을 한 곳에만 둔다."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def max_request_body_bytes(self) -> int:
        """요청 바디 남용 차단선(바이트). 정밀 한도가 아니다 — 파일당 판정은 max_upload_bytes 실측 검사가 한다."""
        return self.MAX_REQUEST_BODY_SIZE_MB * 1024 * 1024

    @model_validator(mode="after")
    def _forbid_body_cap_below_file_limit(self) -> "Settings":
        # 바디 차단선이 파일당 한도보다 낮으면 정상 단일 파일도 조기 거절된다 — 설정 실수를 기동 시 잡는다.
        if self.MAX_REQUEST_BODY_SIZE_MB < self.MAX_UPLOAD_SIZE_MB:
            raise ValueError(
                f"MAX_REQUEST_BODY_SIZE_MB({self.MAX_REQUEST_BODY_SIZE_MB})는 "
                f"MAX_UPLOAD_SIZE_MB({self.MAX_UPLOAD_SIZE_MB}) 이상이어야 합니다."
            )
        return self

    @model_validator(mode="after")
    def _forbid_nonpositive_file_count(self) -> "Settings":
        # 개수 상한이 1 미만이면 정상 업로드까지 전부 거절된다 — 설정 실수를 기동 시 잡는다.
        if self.MAX_UPLOAD_FILES < 1:
            raise ValueError(f"MAX_UPLOAD_FILES({self.MAX_UPLOAD_FILES})는 1 이상이어야 합니다.")
        return self

    @model_validator(mode="after")
    def _forbid_dev_bypass_outside_dev(self) -> "Settings":
        # AUTH_DEV_BYPASS 는 development 에서만 — 비-dev 기동 시 fail-fast (인증 우회가 프로덕션에 서는 것 방지)
        if self.AUTH_DEV_BYPASS and self.APP_ENV != "development":
            raise ValueError("AUTH_DEV_BYPASS 는 development 환경에서만 허용됩니다.")
        return self


settings = Settings()
