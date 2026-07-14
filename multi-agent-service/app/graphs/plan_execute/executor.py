"""sub-agent 안전 호출 래퍼."""

from __future__ import annotations

import asyncio
import time
from typing import Any

from core.logger import logger
from graphs.plan_execute.callbacks import _ToolTraceCallback
from graphs.results import AgentResult
from langchain_core.messages import HumanMessage


async def _invoke_agent_safe(
    agent,
    task: str,
    agent_name: str,
    timeout: float = 90.0,
    max_retries: int = 0,
    retry_delay: float = 1.0,
    group: int = -1,
    react_recursion_limit: int = 20,
    tool_trace_sink: list[dict[str, Any]] | None = None,
    stream_writer: Any = None,
) -> AgentResult:
    """에이전트 안전 호출 — 타임아웃/예외 처리 + 지수 백오프 재시도."""
    from langchain_core.messages import AIMessage

    last_result: AgentResult = AgentResult.exception(
        agent=agent_name, task=task, exc=RuntimeError("no attempt made"), group=group
    )

    for attempt in range(1 + max_retries):
        t0 = time.monotonic()
        try:
            # run_name=도메인명 — LangSmith/langfuse trace 트리에서 generic "LangGraph" 대신 도메인 식별
            invoke_config: dict[str, Any] = {"recursion_limit": react_recursion_limit, "run_name": agent_name}
            if tool_trace_sink is not None or stream_writer is not None:
                invoke_config["callbacks"] = [
                    _ToolTraceCallback(
                        agent_name=agent_name,
                        sink=tool_trace_sink if tool_trace_sink is not None else [],
                        stream_writer=stream_writer,
                    ),
                ]
            output = await asyncio.wait_for(
                agent.ainvoke({"messages": [HumanMessage(content=task)]}, config=invoke_config),
                timeout=timeout,
            )
            msgs = output.get("messages", [])
            ai_msgs = [m for m in reversed(msgs) if isinstance(m, AIMessage)]
            elapsed = round(time.monotonic() - t0, 2)
            if not ai_msgs or not ai_msgs[0].content:
                last_result = AgentResult.empty(agent=agent_name, task=task, elapsed_s=elapsed, group=group)
            else:
                if attempt > 0:
                    logger.info("[%s] 재시도 성공 (attempt %d)", agent_name, attempt + 1)
                return AgentResult.ok(
                    agent=agent_name, task=task, payload=ai_msgs[0].content, elapsed_s=elapsed, group=group
                )
        except TimeoutError:
            elapsed = round(time.monotonic() - t0, 2)
            last_result = AgentResult.timeout(
                agent=agent_name, task=task, timeout_s=timeout, elapsed_s=elapsed, group=group
            )
            logger.warning("[%s] 타임아웃 (attempt %d/%d)", agent_name, attempt + 1, 1 + max_retries)
        except Exception as e:
            elapsed = round(time.monotonic() - t0, 2)
            last_result = AgentResult.exception(agent=agent_name, task=task, exc=e, elapsed_s=elapsed, group=group)
            logger.warning("[%s] 오류 (attempt %d/%d): %s", agent_name, attempt + 1, 1 + max_retries, e)
        if attempt < max_retries:
            await asyncio.sleep(retry_delay * (2**attempt))

    return last_result
