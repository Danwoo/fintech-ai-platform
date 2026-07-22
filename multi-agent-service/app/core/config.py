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
    SERVICE_NAME: str = "multi-agent-service"
    VICTORIALOGS_URL: str = ""

    # 로컬 개발 전용 JWT 우회 (default false, development 밖에서는 기동 거부)
    AUTH_DEV_BYPASS: bool = False

    # CORS 허용 origin (와일드카드 금지 — 명시 목록)
    CORS_ALLOW_ORIGINS: list[str] = ["http://localhost:3000"]

    # 인증 — frontend·backend·MCP 서버들과 동일 JWT_SECRET (사용자 JWT 검증 + 서비스 토큰 발급)
    JWT_SECRET: str = ""

    # 공통 DB (ai_chat_history — 멀티턴 히스토리 read-only)
    MULTI_AGENT_SQL_DB_DRIVER: str = "mssql+pyodbc"
    MULTI_AGENT_SQL_DB_ODBC_DRIVER: str = "ODBC Driver 18 for SQL Server"
    MULTI_AGENT_SQL_DB_HOST: str = ""
    MULTI_AGENT_SQL_DB_PORT: int = 1433
    MULTI_AGENT_SQL_DB_NAME: str = ""
    MULTI_AGENT_SQL_DB_USER: str = ""
    MULTI_AGENT_SQL_DB_PASSWORD: str = ""

    # MCP 서버 (비면 도구 0개로 기동 — sub-agent 는 LLM 지식 전용)
    MCP_SERVERS: list[McpServer] = []

    # LLM — Router(소형: ReAct/plan/가드레일) / Generator(대형: 답변 생성·평가) 2계층
    ROUTER_LLM_BASE_URL: str = ""
    ROUTER_LLM_API_KEY: str = "EMPTY"
    ROUTER_LLM_MODEL: str = ""
    GENERATOR_LLM_BASE_URL: str = ""
    GENERATOR_LLM_API_KEY: str = "EMPTY"
    GENERATOR_LLM_MODEL: str = ""

    # 도메인 토글 — instrument/financials/risk/market 중 활성화할 목록
    MULTI_AGENT_DOMAINS: list[str] = ["instrument", "financials", "risk", "market"]

    # 실행 파라미터 (타임아웃·재시도·루프 상한)
    MA_CLARIFY_TIMEOUT_S: float = 15.0
    MA_AGENT_TIMEOUT_S: float = 120.0
    MA_AGENT_MAX_RETRIES: int = 1
    MA_SUB_AGENT_TIMEOUT_S: float = 60.0
    MA_PLAN_TIMEOUT_S: float = 60.0
    MA_ANSWER_TIMEOUT_S: float = 60.0
    MA_DELEGATE_MAX_CALLS: int = 2
    MA_REACT_RECURSION_LIMIT: int = 8
    # 재계획 — 순차 의존 질문에서 직전 결과를 보고 후속 stage 를 동적 추가하는 횟수 상한 (0=비활성)
    MA_MAX_REPLAN: int = 2

    # Hierarchical Map-Reduce — 활성 도메인 수가 임계 이상이면 도메인별 sub-answer 후 통합
    MA_MAP_REDUCE_DOMAIN_THRESHOLD: int = 3
    MA_MAP_CONCURRENCY: int = 3
    MA_MAP_TIMEOUT_S: float = 50.0
    MA_REDUCE_MODE: str = "full"  # "full" | "disabled"(sub-answer concat, 긴급 회피)

    # 가드레일 / 레이트리밋
    MA_GUARDRAIL_ENABLED: bool = True
    MA_RATE_LIMIT_PER_MINUTE: int = 30
    MA_MAX_CONCURRENT_STREAMS: int = 10

    # 응답 캐시 — 비결정적·시점 의존 응답이라 프로덕션은 false 권장 (개발·데모용)
    MA_RESPONSE_CACHE_ENABLED: bool = False
    MA_RESPONSE_CACHE_TTL_S: float = 300.0
    MA_RESPONSE_CACHE_MAX_ENTRIES: int = 128

    # trace 이벤트 metadata (sub_agent_calls·domain_hits·composite_score) 생성 토글
    MA_TRACE_TOKEN_USAGE: bool = True

    # langfuse 관측 — 세 키가 모두 있으면 graph 실행을 langfuse 로 trace (서버 OTEL 지원 필요)
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = ""

    # LangSmith 관측 — API_KEY 있으면 main 이 os.environ 주입 → langchain 자동 trace
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "multi-agent"

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
