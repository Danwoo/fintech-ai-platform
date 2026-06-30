# ── [가이드 7/9] services/chat/chat_service.py — 에이전트 보유 + 스트리밍 오케스트레이션 ──
# 무엇: initialize() 가 기동 시 MCP tool 을 1회 수집해 에이전트를 빌드·보관(Singleton). stream_chat 이
#   agent.astream 을 돌며 tool 호출 시작 → step 이벤트, 답변 토큰 → token 이벤트를 yield.
# 복사 후: 도메인 메서드/프롬프트. tool 수집·에이전트 빌드 골격은 그대로.
# 함정: initialize 는 lifespan 에서 1회만(매 요청 재빌드 금지) · MCP 미기동이면 tool 0개로 fail-soft
#   (에이전트는 LLM 지식만으로 답, 스트림은 안 깨짐) · stream_mode=["updates","messages"] 면 astream 이
#   (mode, chunk) 튜플을 준다 · token 은 messages 모드의 AIMessageChunk content 델타(tool 노드 메시지 제외).

from collections.abc import AsyncGenerator

from agents.chat_agent import build_chat_agent
from clients.mcp.mcp_client import collect_tool_examples, get_cached_tools
from core.logger import logger
from langchain_core.messages import AIMessageChunk, HumanMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

_RECURSION_LIMIT = 20


class ChatService:
    """웹 검색 tool 을 호출하는 단일 ReAct 에이전트 챗. MCP tool 은 기동 시 1회 수집해 보관."""

    def __init__(self, mcp_client: MultiServerMCPClient, llm: ChatOpenAI):
        self.mcp_client = mcp_client
        self.llm = llm
        self.agent = None

    async def initialize(self) -> None:
        """lifespan 에서 1회 호출 — MCP tool 수집 후 에이전트 빌드. MCP 미기동이면 tool 0개로 fail-soft."""
        try:
            tools = await get_cached_tools(self.mcp_client)
        except Exception as e:
            logger.warning(f"MCP tool 수집 실패 — tool 0개로 기동 (LLM 지식만으로 답): {e!r}")
            tools = []
        examples = collect_tool_examples(tools)  # tool _meta 의 few-shot → 프롬프트 블록
        self.agent = build_chat_agent(self.llm, tools, examples)
        logger.info("ChatService initialized: tools=%d, few-shot=%s", len(tools), "있음" if examples else "없음")

    async def stream_chat(self, question: str) -> AsyncGenerator[dict, None]:
        """질문 → 에이전트 수행 → 이벤트 스트리밍.

        tool 호출 시작은 ``{"type":"step", ...}``, 답변 토큰은 ``{"type":"token","content": ...}`` 이벤트로 yield.
        """
        if self.agent is None:
            await self.initialize()

        announced: set[str] = set()  # tool step 중복 방지 (tool 이름은 첫 chunk 에만 옴)
        async for mode, chunk in self.agent.astream(
            {"messages": [HumanMessage(content=question)]},
            {"recursion_limit": _RECURSION_LIMIT},
            stream_mode=["updates", "messages"],
        ):
            if mode == "messages":
                msg, meta = chunk
                if meta.get("langgraph_node") == "tools" or not isinstance(msg, AIMessageChunk):
                    continue
                for tc in msg.tool_call_chunks or []:
                    name = tc.get("name")
                    if name and name not in announced:
                        announced.add(name)
                        yield {"type": "step", "tool": name, "message": f"{name} 호출 중"}
                if isinstance(msg.content, str) and msg.content:
                    yield {"type": "token", "content": msg.content}
