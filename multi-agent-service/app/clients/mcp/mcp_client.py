"""MCP tool 수집 전용 클라이언트 — langchain_mcp_adapters 0.2.2 기반.

5개 MCP 서버(market-data/disclosure/news/web/doc-search)의 tool 을 모아 sub-agent 에 분배한다.
tool 호출 자체는 LangGraph 에이전트(ReAct)가 수행 — 이 모듈은 연결·수집·캐싱만.
"""

import json
from datetime import timedelta

from clients.mcp.mcp_auth import ServiceJwtAuth
from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

# tool 목록은 런타임에 변하지 않으므로 한 번 조회 후 캐싱
_cached_tools: list[BaseTool] | None = None


async def get_cached_tools(client: MultiServerMCPClient) -> list[BaseTool]:
    """tool 목록 일차 캐싱. 매 호출 반복 조회 방지."""
    global _cached_tools
    if _cached_tools is None:
        _cached_tools = await client.get_tools()
    return _cached_tools


def collect_tool_examples(tools: list[BaseTool]) -> str:
    """넘긴 tool 들의 few-shot 예시(_meta)를 모아 프롬프트 블록 생성. 없으면 빈 문자열.

    서버가 tool _meta 로 노출(meta.few_shot_examples)하면 adapter 는 tool.metadata["_meta"] 로 전달한다.
    multi-agent 는 sub-agent 마다 자기 바인딩 tool 만 넘겨 호출 → 각 sub-agent 가 자기 예시만 받는다.
    이 hop(서버 meta → wire → tool.metadata["_meta"])은 여기 한 곳에만 가둔다.
    """
    lines: list[str] = []
    for t in tools:
        meta = (getattr(t, "metadata", None) or {}).get("_meta") or {}
        for ex in meta.get("few_shot_examples") or []:
            lines.append(f'- {t.name}: "{ex.get("질문", "")}" → {json.dumps(ex.get("호출", {}), ensure_ascii=False)}')
    return "### 도구 호출 예시 (질문 → 인자)\n" + "\n".join(lines) if lines else ""


def build_mcp_connections(config) -> dict[str, dict]:
    """config.MCP_SERVERS 로부터 MultiServerMCPClient 연결 설정 생성."""
    return {
        s.name: {
            "transport": "streamable_http",
            "url": s.url.rstrip("/") + s.path,
            "auth": ServiceJwtAuth(),
            "timeout": timedelta(seconds=30),
            "sse_read_timeout": timedelta(seconds=300),
        }
        for s in config.MCP_SERVERS
        if s.enabled
    }


def get_mcp_client(config) -> MultiServerMCPClient:
    """MCP 서버 연결 클라이언트 생성."""
    return MultiServerMCPClient(build_mcp_connections(config))
