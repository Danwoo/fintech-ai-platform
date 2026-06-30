# ── [가이드 4/9] clients/mcp/mcp_client.py — MultiServerMCPClient 빌더 + tool 캐시 ──
# 무엇: config.MCP_SERVERS → langchain_mcp_adapters 의 MultiServerMCPClient. get_cached_tools 가
#   tool 목록을 1회 조회해 캐싱(런타임에 안 변함). 에이전트는 이 tool 들을 LLM 에 바인딩한다.
# 복사 후: MCP_SERVERS 기본값만 config 에서. 서버를 늘려도 이 파일은 불변(설정만 추가).
# 함정: tool 이름 = MCP 서버 router 의 operation_id (예: web_search) — 서버에서 이름이 바뀌면
#   못 찾는다(lockstep) · auth=ServiceJwtAuth() 매요청 재발급 · MCP 미기동이면 get_tools 가 예외 →
#   service 에서 fail-soft(tool 0개)로 흡수 · 캐시는 워커별(in-process)이라 --workers 늘려도 안전.

import json
from datetime import timedelta

from clients.mcp.mcp_auth import ServiceJwtAuth
from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

_cached_tools: list[BaseTool] | None = None


async def get_cached_tools(client: MultiServerMCPClient) -> list[BaseTool]:
    """tool 목록 일차 캐싱. 매 호출 반복 조회 방지."""
    global _cached_tools
    if _cached_tools is None:
        _cached_tools = await client.get_tools()
    return _cached_tools


def collect_tool_examples(tools: list[BaseTool]) -> str:
    """넘긴 tool 들의 few-shot 예시(_meta)를 모아 시스템 프롬프트 블록 생성. 없으면 빈 문자열.

    서버가 tool _meta 로 노출(meta.few_shot_examples)하면 adapter 는 tool.metadata["_meta"] 로 전달한다.
    이 hop(서버 meta → wire → tool.metadata["_meta"])은 여기 한 곳에만 가둔다 — 직접 metadata 만지지 말 것.
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
