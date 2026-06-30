# devactivity-service — 포트폴리오 활동 요약 스케줄러 + 활동 조회 챗

> FastAPI 백엔드(`:8001`). 계좌·포트폴리오 데이터는 직접 만지지 않고 **portfolio-mcp-service(:8002) 의 MCP tool** 로만 가져온다.
> 두 가지를 시연한다 — (1) APScheduler 매니저가 주기적으로 계좌 활동을 모아 LLM 으로 요약한 **주간 포트폴리오 활동 요약 메일**, (2) LangGraph 에이전트가 MCP tool 을 호출해 답하는 **"포트폴리오 활동 조회" SSE 챗**.

## 핵심 (이 서비스가 보여주는 패턴·기술)

- **MCP 소비자 패턴** — 포트폴리오 도메인 데이터는 portfolio-mcp-service 가 단독 소유하고, 이 서비스는 `MultiServerMCPClient` 로 tool 만 호출한다 (거래·계좌 시스템 직접 호출 0). `MCP_SERVERS` config 에 서버를 추가하기만 하면 멀티 MCP 서버로 자동 확장 — 소비자 코드·프롬프트는 불변.
- **에이전트 챗 (LangGraph `create_agent`)** — LLM 이 등록된 MCP tool 을 스스로 골라 호출하는 ReAct 루프. 진행 단계(`도구 준비/생각 중/tool 호출 중`)와 답변 토큰을 **SSE 로 스트리밍**. 멀티턴은 매 요청에 history 동봉 → **서버 무상태**(checkpointer 없음).
- **asyncio 스케줄러 매니저** — `AsyncIOScheduler` 가 기동 시 활성 스케줄러(`use_at='Y'`)를 cron 잡으로 자가적재하고, CRUD 변경마다 `sync()`/`unregister()` 로 잡 테이블과 동기화. `period_weeks` 로 N주 간격(ISO 주차 step) 지원. 중복 실행 방지 위해 `--workers=1`.
- **마스터-디테일 CRUD** — 스케줄러(master) ↔ 발송 대상 계좌(detail) 를 Router→Service→Repository raw SQL 레이어로 구현. DevExtreme 그리드(`skip`/`take`/`filter`/`sort`) 호환.
- **서비스 간 인증** — MCP 호출 시 `ServiceJwtAuth`(httpx Auth) 가 요청 직전 fresh 서비스 JWT(exp 1분)를 주입해 streamable-http 토큰 만료 401 회피.
- **스트림 안전성** — `StreamingResponse` 는 시작 후 예외를 exception handler 가 못 잡으므로, 라우터가 도메인 예외 외 내부 디테일·MCP tool 에러를 한국어 메시지로 마스킹해 SSE 로 흘린다.
- **컴플라이언스 (투자 리서치 애널리스트 페르소나)** — 활동 요약은 계좌·거래 내역에만 근거하고 수치를 지어내지 않으며, 매매 권유 표현 없이 "ⓘ 정보 제공 목적이며 투자 조언이 아닙니다" 고지를 메일에 덧붙인다.

## 기술 스택

- **Web**: FastAPI · uvicorn(`--workers=1`) · SSE(`StreamingResponse`)
- **에이전트/LLM**: LangGraph `create_agent` · langchain-mcp-adapters(`MultiServerMCPClient`) · `ChatOpenAI`(OpenAI 호환 `/chat/completions`) · structured output
- **스케줄러**: APScheduler `AsyncIOScheduler` + `CronTrigger`(Asia/Seoul)
- **DB**: MS SQL Server(pyodbc) + SQLAlchemy `text()` raw SQL · alembic push
- **DI**: dependency-injector (`Container` + `@inject`)
- **기타**: httpx · tenacity 재시도 · SMTP 메일

## 아키텍처 / 동작

```
                              ┌─ POST /chat ──→ PortfolioChatService ─→ LangGraph create_agent ─┐
  Frontend ── JWT(HS256) ──→  │                                                                ├─→ MCP tool 호출
                              └─ scheduler CRUD ─→ SchedulerService ─→ raw SQL (DEVACTIVITY)   │   (portfolio-mcp-service)
                                                          │                                    │        ▲
  APScheduler(주기 cron, KST) ── run() ──→ ActivityReportService ──┘                            │  ServiceJwtAuth
                                              │  portfolio_get_account_activity(주별) ───────────┘  (fresh JWT/req)
                                              ├─ dedupe/collect → LLM 요약(structured)
                                              └─ render_html → SMTP 메일 발송
```

- **소비하는 MCP tool (portfolio-mcp-service operation_id)**: `portfolio_list_accounts` · `portfolio_list_holdings` · `portfolio_search_transactions` · `portfolio_search_orders` · `portfolio_get_account_activity`. tool 선택은 각 tool 의 name(operation_id)+description 이 담당하고, 서버 instructions 는 initialize 핸드셰이크에서 끌어와 system 프롬프트에 합친다.
- **포트폴리오 데이터는 기본 MOCK 으로 동작** — portfolio-mcp-service 가 API 키 없이 인메모리 픽스처(공개 티커 샘플)를 반환하므로, 키 설정 없이 챗·요약이 바로 구동된다.
- **챗 흐름**: 질문 + UI 범위 필터(account/kind/symbols/holders/since/until)를 system 프롬프트 범위로 주입 → 에이전트가 tool 호출 → 토큰/진행 이벤트 SSE.
- **활동 요약**: 멤버별 account_id 로 주 단위 `portfolio_get_account_activity` 조회 → 중복·분할 거래 병합(`dedupe_common`) → LLM 이 "큰 단위 활동(신규 편입·비중 조정·배당·이자·리밸런싱)" 중심으로 압축(structured output) → 멤버당 주차 섹션을 한 통으로 HTML 메일 발송.
- **레이어**: `Router(@inject + Depends(verify_access_token)) → Service(도메인 로직·예외) → Repository(thin raw SQL)`. MCP/LLM/메일 같은 외부 시스템은 store 가 아니라 compute 이므로 `clients/` 에 둔다. DI 경계는 `core/container.py` 의 `config = providers.Object(settings)` 하나.

## 실행

```bash
uv sync
cp app/.env.example app/.env.development   # CHANGE_ME 값 채우기

# portfolio-mcp-service(:8002) 가 먼저 떠 있어야 챗·요약이 동작 (기본 MOCK 데이터로 키 없이 구동)
cd app && uv run uvicorn main:app --reload   # :8001 (cwd=app 필수)
```

필요한 `.env` 키 — `DEVACTIVITY_SQL_DB_*`(스케줄러 저장), `MCP_SERVERS`(예: `[{"name":"portfolio","url":"http://localhost:8002"}]`), `LLM_BASE_URL`/`LLM_MODEL`/`LLM_API_KEY`, `EMAIL_*`(SMTP), `JWT_SECRET`(frontend·backend 동일값 필수).

## 구조

```
app/
  main.py                       FastAPI 앱 · lifespan 에서 스케줄러 start/stop · :8001
  routers/chat/                 SSE 챗 + 계좌/계좌주 목록 (/chat)
  routers/scheduler/            스케줄러·멤버 CRUD + 즉시 실행 (/scheduler)
  services/chat/                PortfolioChatService — MCP tool-calling 에이전트 챗
  services/report/              ActivityReportService — 활동 수집→LLM 요약→메일
  services/scheduler/           SchedulerService — master/detail 도메인 로직
  managers/scheduler_manager.py APScheduler 매니저 (cron 잡 자가적재·sync)
  clients/mcp/                  MultiServerMCPClient · 에이전트 러너 · 서비스 JWT auth · 프롬프트
  clients/llm,mail,mssql/       LLM(OpenAI 호환) · SMTP · MSSQL 연결
  repositories/scheduler/       thin raw SQL (ROW_NUMBER 페이지네이션·DevExtreme 필터)
  utils/                        common(devextreme/db/retry/time) · chat · report 순수함수
```
