# services/chat/portfolio_chat_service.py
from collections.abc import AsyncGenerator

from clients.mcp.mcp_agent import stream_mcp_agent
from clients.mcp.mcp_client import call_mcp_tool, get_cached_instructions
from clients.mcp.mcp_prompt import compose_system_prompt
from langchain_core.messages import HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from utils.chat.chat_utils import date_context, lc_history, scope_note
from utils.common.time_utils import now_kst


class PortfolioChatService:
    """포트폴리오 활동 기반 챗. 데이터는 portfolio-mcp-service MCP tool 을 LLM 이 직접 호출(LangGraph 에이전트).

    list_accounts/list_holders(좌측 패널·드롭다운)도 MCP tool 호출로 처리.
    chat()은 멀티 MCP(MultiServerMCPClient) tool-calling 에이전트 + 답변 스트리밍.
    """

    def __init__(self, mcp_client: MultiServerMCPClient, chat_client: ChatOpenAI):
        self.mcp_client = mcp_client
        self.chat_client = chat_client

    async def list_accounts(self) -> list[dict]:
        """좌측 패널/범위 필터용 — MCP portfolio_list_accounts tool 호출."""
        data = await call_mcp_tool(self.mcp_client, "portfolio_list_accounts")
        return data.get("items", [])

    async def list_holders(self) -> list[dict]:
        """계좌주 필터 드롭다운용 — MCP portfolio_list_accounts tool 에서 보유자 정보 추출."""
        data = await call_mcp_tool(self.mcp_client, "portfolio_list_accounts")
        seen: dict[str, dict] = {}
        for acc in data.get("items", []):
            holder = acc.get("holder") or acc.get("name", "")
            email = acc.get("holder_email", "")
            key = email or holder
            if key and key not in seen:
                seen[key] = {"account_id": acc.get("account_id", ""), "name": holder, "email": email}
        return list(seen.values())

    async def chat(
        self,
        question: str,
        account: str | None,
        since: str | None = None,
        until: str | None = None,
        kind: str | None = None,
        symbols: list[str] | None = None,
        holders: list[str] | None = None,
        history: list[dict] | None = None,
    ) -> AsyncGenerator[dict, None]:
        """질문 → LLM 이 등록된 MCP tool 을 호출(에이전트) → 답변 스트리밍.

        진행 단계는 ``{"status": ...}``, 답변 토큰은 ``{"content": ...}`` 이벤트로 yield.
        UI 조건(account/kind/symbols/holders/since/until)은 system 프롬프트 범위로 주입 — LLM 이 도구 인자에 반영.
        history 는 멀티턴(매 요청 동봉, 서버 무상태).
        """
        scope = scope_note(account, since, until, kind, symbols, holders)
        dynamic = f"## 오늘 날짜와 기간 기준 (KST)\n{date_context(now_kst())}" + (
            f"\n\n## 기본 조회 범위\n{scope}" if scope else ""
        )
        domain_blocks = await get_cached_instructions(self.mcp_client)
        system = compose_system_prompt(domain_blocks, dynamic=dynamic)
        messages = [*lc_history(history), HumanMessage(content=question)]
        # 출력 안전 가드(canary·프롬프트유출·한자·욕설)는 LiteLLM 게이트웨이 SafetyGuard 가 스트리밍/비스트리밍 모두 담당
        # MCP 연결·에이전트 루프·스트림→SSE 매핑은 재사용 러너에 위임 (이 서비스는 포트폴리오 도메인 프롬프트·메시지만 구성)
        async for event in stream_mcp_agent(self.chat_client, self.mcp_client, system, messages):
            yield event
