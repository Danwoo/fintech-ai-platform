"""Plan-then-Execute StateGraph — 결정론적 멀티 에이전트 실행 엔진.

ReAct Supervisor 와의 핵심 차이: LLM 은 "계획"만 세우고 실행은 코드가 담당해
순차/병렬을 강제한다 (LLM 이 언제 멈출지 결정하지 않음).

플로우:
  [Query]
    → clarify_node(LLM)                     # proceed/clarify/refuse 분기
    → plan_node(LLM)                        # depends_on_agents 포함 ExecutionPlan → pending_stages 큐 적재
    → run_stage_node(결정론적)              # 큐에서 stage 1개 pop 실행 (stage 내 병렬)
    → replan_node(LLM, 별도):               # 실행과 분리된 '재계획' — 순차 의존 후속을 동적 재배정
         · pending 남음/추가      → run_stage_node 루프
         · done or 상한(max_replan) → _route_after_execute:
              · 1-2 도메인  → answer_node(LLM)              → [Answer]
              · 3+ 도메인   → map_answer(도메인별 sub-answer) → reduce(통합) → [Answer]

사용:
    graph = build_plan_execute_graph(planner_llm=..., generator_llm=..., agents={...})
    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=query)]},
        config={"recursion_limit": 100},
    )
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Annotated, Any, Literal

from core.logger import logger
from graphs.results import AgentResult
from graphs.shared import _WRITER_SYSTEM, _WRITER_USER_TEMPLATE, join_tool_evidence
from graphs.system import (
    ANSWER_SYSTEM,
    ANSWER_USER_TEMPLATE,
    CLARIFY_SYSTEM,
    MAP_DOMAIN_SYSTEM,
    MAP_DOMAIN_USER_TEMPLATE,
    PLAN_SYSTEM,
    PLAN_SYSTEM_TEMPLATE,
    REDUCE_SYSTEM,
    REDUCE_USER_TEMPLATE,
    REPLAN_SYSTEM,
    REPLAN_SYSTEM_TEMPLATE,
    REPLAN_USER_TEMPLATE,
    SYNTHESIS_SYSTEM,
    SYNTHESIS_USER_TEMPLATE,
)
from langchain_core.callbacks.base import AsyncCallbackHandler
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import TypedDict
from utils.agent.prompting import build_node_messages
from utils.redaction.redactor import redact_operational_info

# ─────────────────────────────────────────────────────────
# Pydantic 스키마 (타입 힌트 / 정적 참조용)
# ─────────────────────────────────────────────────────────

# 정적 에이전트 목록 — 타입 힌트용. 실제 LLM 스키마는 build_plan_execute_graph() 가
# agents.keys() 로 동적 생성한다.
VALID_AGENTS = Literal[
    "instrument_domain",
    "financials_domain",
    "risk_domain",
    "market_domain",
]


class StageTask(BaseModel):
    """단일 에이전트 작업 (타입 힌트용 — Literal 고정)."""

    agent_name: VALID_AGENTS = Field(description="호출할 에이전트 이름")
    task: str = Field(
        description=(
            "핵심 작업 (간결하게, 80자 이내). [이전 대화] 맥락의 지시대명사·생략을 해소해 "
            "그 자체로 완결적인 검색어가 되도록 작성."
        )
    )
    # 의미 기반 의존성 — execute_node 가 이 필드로 위상 정렬해 독립 tasks 를 같은 stage 로 병합
    depends_on_agents: list[str] = Field(
        default_factory=list,
        description=(
            "이 task가 결과를 받아야 하는 선행 에이전트 이름들. "
            "다른 에이전트의 출력이 본 task 입력에 직접 필요하면 그 에이전트 이름을 명시. "
            "독립 조사로 답할 수 있으면 빈 리스트 []."
        ),
    )


class ExecutionPlan(BaseModel):
    """LLM이 생성하는 실행 계획 (타입 힌트용)."""

    reasoning: str | None = Field(default=None, exclude=True)
    stages: list[list[StageTask]] = Field(
        description="실행 단계 목록. 각 stage 내 tasks는 병렬 실행, stages 간은 순차 실행. 도메인 외 질문이면 빈 리스트 []."
    )


class ReplanDecision(BaseModel):
    """재계획 노드 출력 — 직전 stage 결과를 보고 추가 조사 여부·내용을 결정."""

    done: bool = Field(description="지금까지 결과로 사용자 질문에 충분히 답할 수 있으면 True (종료)")
    reason: str = Field(description="판단 근거 한 문장 (trace 가독용)")
    next_stage: list[StageTask] = Field(
        default_factory=list,
        description=(
            "done=False 일 때만: 다음에 실행할 stage. 직전 결과에 담긴 식별자(공시 접수번호·종목코드·기관명 등)를 "
            "그 식별자에 맞는 도구를 가진 에이전트가 이어받아 조사하도록 task 를 작성. 보통 1개."
        ),
    )


# ─────────────────────────────────────────────────────────
# State
# ─────────────────────────────────────────────────────────


class PlanExecuteState(TypedDict):
    messages: Annotated[list, add_messages]  # 사용자 쿼리 (멀티턴 히스토리 포함)
    plan: ExecutionPlan | None
    stage_results: list[dict[str, Any]]
    agent_calls: list[str]  # 실제 호출된 에이전트 순서
    final_answer: str
    guardrail_blocked: bool  # 보안검사 노드가 UNSAFE 차단 시 True (이후 END)
    clarify_intent: str | None  # "proceed" | "clarify" | "refuse"
    clarification_question: str | None
    refusal_message: str | None
    tool_calls: list[dict[str, Any]]  # [{agent, tool, input, output, latency_s, status}]
    refused_topics: list[str]  # 이전 turn 에서 거절한 주제 키워드 누적 (멀티턴 거절 일관성)
    domain_answers: dict[str, dict[str, Any]]  # Map-Reduce 경로의 도메인별 sub-answer
    pending_stages: list[list[StageTask]]  # 실행 대기 stage 큐 (계획수립이 채우고, 재계획이 추가, 단계실행이 pop)
    replan_count: int  # 재계획 횟수 (상한 MAX_REPLAN 체크용)


def _tool_output_text(output: Any) -> str:
    """MCP content-block / ToolMessage 출력에서 실제 텍스트(JSON)를 추출 — repr 저장 시 묻히는 내부 JSON 복원.

    grounding·extract_media·trace 가 파싱 가능한 raw 를 받도록, 콜백이 str(output)(repr) 대신 이걸 쓴다.
    """
    if isinstance(output, str):
        return output
    content = getattr(output, "content", output)
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text" and isinstance(block.get("text"), str):
                    parts.append(block["text"])
                elif block.get("type") == "json" and block.get("json") is not None:
                    parts.append(json.dumps(block["json"], ensure_ascii=False))
            elif isinstance(block, str):
                parts.append(block)
        if parts:
            return "\n".join(parts)
    if isinstance(content, str):
        return content
    return str(output)


class _ToolTraceCallback(AsyncCallbackHandler):
    """sub-agent 내부 ReAct 의 tool 호출 input/output 캡처.

    on_tool_start/on_tool_end 페어로 호출당 1개 dict 를 sink 에 누적.
    stream_writer 가 주어지면 tool 호출 시작/끝/실패 시 즉시 custom stream 에 push —
    서비스가 이를 SSE step event 로 변환해 사용자가 실시간 진행을 본다.
    """

    def __init__(self, agent_name: str, sink: list[dict[str, Any]], stream_writer: Any = None) -> None:
        self.agent_name = agent_name
        self.sink = sink
        self.stream_writer = stream_writer
        self._pending: dict[str, dict[str, Any]] = {}  # run_id → start info

    def _push(self, payload: dict[str, Any]) -> None:
        if self.stream_writer is None:
            return
        try:
            self.stream_writer(payload)
        except Exception as e:
            logger.debug("[_ToolTraceCallback] stream_writer push 실패: %s", e)

    async def on_tool_start(  # type: ignore[override]
        self, serialized: dict[str, Any], input_str: str, *, run_id: Any, **kwargs: Any
    ) -> None:
        tool_name = serialized.get("name") if isinstance(serialized, dict) else str(serialized)
        self._pending[str(run_id)] = {
            "agent": self.agent_name,
            "tool": tool_name,
            "input": input_str[:2000] if isinstance(input_str, str) else str(input_str)[:2000],
            "started_at": time.monotonic(),
        }
        self._push({"event": "tool_call_started", "agent": self.agent_name, "tool": tool_name})

    async def on_tool_end(self, output: Any, *, run_id: Any, **kwargs: Any) -> None:  # type: ignore[override]
        rec = self._pending.pop(str(run_id), None)
        if rec is None:
            return
        rec["output"] = _tool_output_text(output)[:8000]  # media(sources/images) JSON 파싱 위해 충분히
        rec["latency_s"] = round(time.monotonic() - rec.pop("started_at", time.monotonic()), 2)
        rec["status"] = "ok"
        self.sink.append(rec)
        self._push(
            {
                "event": "tool_call_completed",
                "agent": self.agent_name,
                "tool": rec["tool"],
                "latency_s": rec["latency_s"],
                "status": "ok",
            }
        )

    async def on_tool_error(self, error: BaseException, *, run_id: Any, **kwargs: Any) -> None:  # type: ignore[override]
        rec = self._pending.pop(str(run_id), None)
        if rec is None:
            return
        rec["output"] = f"{type(error).__name__}: {error}"[:3000]
        rec["latency_s"] = round(time.monotonic() - rec.pop("started_at", time.monotonic()), 2)
        rec["status"] = "error"
        self.sink.append(rec)
        self._push(
            {
                "event": "tool_call_failed",
                "agent": self.agent_name,
                "tool": rec["tool"],
                "latency_s": rec["latency_s"],
                "error_type": type(error).__name__,
            }
        )


class ClarifyDecision(BaseModel):
    """Clarification 노드의 LLM 출력 스키마."""

    intent: str = Field(
        description=(
            "판단 결과. "
            "'proceed'=충분히 명확한 금융·투자 질문, "
            "'clarify'=금융·투자 도메인이지만 너무 모호해 추가 정보 필요, "
            "'refuse'=도메인 외 질문이거나 논리적으로 불가능한 요구."
        )
    )
    question: str = Field(
        default="",
        description="intent='clarify'일 때만 사용. 사용자에게 정중하게 물을 한국어 질문 1~2문장.",
    )
    refusal_reason: str = Field(
        default="",
        description=(
            "intent='refuse'일 때만. 사용자에게 들려주듯 자연스러운 거절 1문장. "
            "'도메인 외', '가치사슬', '시스템 답변 범위' 같은 시스템 메타 표현 금지."
        ),
    )
    suggestion: str = Field(
        default="",
        description="intent='refuse'일 때만. 친근한 대안 안내 1문장.",
    )


# ─────────────────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────────────────


def _extract_query(messages: list) -> str:
    """State messages 에서 마지막 사용자 쿼리 추출."""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            content = m.content
            if "\n\n[이전 대화 결과]" in content:
                return content.split("\n\n[이전 대화 결과]")[0].strip()
            return content.strip()
    return ""


def _build_history_ctx(messages: list, k: int) -> str:
    """현재 turn 이전 messages 의 마지막 k개를 사용자/AI 라벨링하여 문자열로 구성."""
    history_msgs = messages[:-1]
    if not history_msgs:
        return ""
    recent = history_msgs[-k:]
    return "\n".join(f"[{'사용자' if isinstance(m, HumanMessage) else 'AI'}] {str(m.content)}" for m in recent)


def _format_prior_stage_results(all_results: list[dict], prior_tool_calls: list[dict] | None = None) -> str:
    """이전 stage 결과를 다음 stage 에 전달할 텍스트로 포맷 — status != ok 는 제외 (Fail-closed).

    도메인 종합답(평가)이 공시 접수번호·종목코드 같은 식별자를 압축·평가로 묻어버리면 다음 stage 가
    그 식별자로 이어서 조사할 수 없으므로, 검색 원본 식별자도 함께 전달한다.
    """
    parts = []
    for stage_data in all_results:
        for item in stage_data.get("results", []):
            if item.get("status", "ok") != "ok":
                continue
            agent = item.get("agent", "unknown")
            output = redact_operational_info(str(item.get("output", "")))
            if output:
                parts.append(f"[{agent} 종합]\n{output}")
    if prior_tool_calls:
        raw = []
        for tc in prior_tool_calls:
            out = redact_operational_info(str(tc.get("output", "")))[:600]
            if out:
                raw.append(f"- {tc.get('tool', '?')}: {out}")
        if raw:
            parts.append("[검색 원본(공시 접수번호·종목코드 등 식별자 — 이어서 조사 시 사용)]\n" + "\n".join(raw[:6]))
    return "\n\n".join(parts) if parts else ""


def _format_all_results_for_answer(all_results: list[dict]) -> str:
    """모든 stage 결과를 answer_node 용 컨텍스트로 포맷 (output·실패 사유 redaction 적용)."""
    parts = []
    for stage_data in all_results:
        for item in stage_data.get("results", []):
            agent = item.get("agent", "unknown")
            status = item.get("status", "ok")
            if status == "ok":
                output = redact_operational_info(str(item.get("output", "")))
                parts.append(f"## {agent}\n{output}")
            else:
                err_detail = redact_operational_info(str(item.get("output", "")) or f"({status})")
                parts.append(f"## {agent}\n[{agent}_데이터수집실패: {status}] {err_detail}")
    return "\n\n".join(parts) if parts else "(수집된 정보 없음)"


# ─────────────────────────────────────────────────────────
# Hierarchical Map-Reduce 헬퍼
# ─────────────────────────────────────────────────────────

# 컴플라이언스 고지 — 모든 최종 답변 말미에 부착 (LLM 미부착 시 결정론적 폴백 보강)
COMPLIANCE_DISCLAIMER = "ⓘ 정보 제공 목적이며 투자 조언이 아닙니다"


def _ensure_disclaimer(text: str) -> str:
    """답변 말미에 컴플라이언스 고지 1줄 보장 (LLM 이 이미 넣었으면 중복 추가하지 않음)."""
    body = (text or "").rstrip()
    if not body:
        return body
    if "투자 조언이 아닙니다" in body:
        return body
    return f"{body}\n\n{COMPLIANCE_DISCLAIMER}"


_DOMAIN_LABELS: dict[str, str] = {
    "instrument": "종목·시세",
    "financials": "재무·공시",
    "risk": "리스크·밸류",
    "market": "시장·뉴스·매크로",
}


def _build_subagent_domain_map() -> dict[str, str]:
    """전체 도메인 모듈의 (sub_agent_name → domain) 매핑 빌드 (활성 도메인과 무관 — 분류 전용)."""
    mapping: dict[str, str] = {}
    try:
        from agents.domains.financials import SUBAGENT_SPECS as FINANCIALS_SPECS
        from agents.domains.instrument import SUBAGENT_SPECS as INSTRUMENT_SPECS
        from agents.domains.market import SUBAGENT_SPECS as MARKET_SPECS
        from agents.domains.risk import SUBAGENT_SPECS as RISK_SPECS

        for spec_set in (INSTRUMENT_SPECS, FINANCIALS_SPECS, RISK_SPECS, MARKET_SPECS):
            for name, spec in spec_set.items():
                mapping[name] = spec.domain
    except Exception as exc:
        logger.warning("[plan_execute] SUBAGENT_SPECS 로드 실패: %s — 이름 prefix 휴리스틱만 사용", exc)
    return mapping


_SUBAGENT_DOMAIN_MAP: dict[str, str] = _build_subagent_domain_map()


def _classify_domain(agent_name: str) -> str | None:
    """agent 이름 → 4 도메인 분류. SUBAGENT_SPECS 의 domain 필드 우선, 그 외 이름 prefix."""
    if not agent_name:
        return None
    if agent_name in _SUBAGENT_DOMAIN_MAP:
        return _SUBAGENT_DOMAIN_MAP[agent_name]
    for domain in _DOMAIN_LABELS:
        if agent_name == f"{domain}_domain" or agent_name.startswith(f"{domain}_"):
            return domain
    return None


def _group_results_by_domain(all_results: list[dict]) -> dict[str, list[dict]]:
    """stage_results 를 도메인별로 그룹화. 미분류 agent 는 'other'."""
    grouped: dict[str, list[dict]] = {}
    for stage_data in all_results:
        for item in stage_data.get("results", []):
            agent = item.get("agent", "")
            domain = _classify_domain(agent) or "other"
            grouped.setdefault(domain, []).append(item)
    return grouped


def _count_active_domains(all_results: list[dict]) -> int:
    """stage_results 에서 실제 호출된 도메인(4 카테고리) 개수. 'other'·빈 stage 제외."""
    grouped = _group_results_by_domain(all_results)
    return sum(1 for domain, items in grouped.items() if domain in _DOMAIN_LABELS and items)


def _format_domain_results(items: list[dict]) -> str:
    """단일 도메인의 sub-agent 결과를 Map prompt 입력 텍스트로 포맷."""
    parts = []
    for item in items:
        agent = item.get("agent", "unknown")
        status = item.get("status", "ok")
        if status == "ok":
            output = redact_operational_info(str(item.get("output", "")))
            parts.append(f"### {agent}\n{output}")
        else:
            err_detail = redact_operational_info(str(item.get("output", "")) or f"({status})")
            parts.append(f"### {agent}\n[{agent}_데이터수집실패: {status}] {err_detail}")
    return "\n\n".join(parts) if parts else "(이 도메인 수집 결과 없음)"


# ─────────────────────────────────────────────────────────
# 의존성 기반 stage 위상 정렬
# ─────────────────────────────────────────────────────────


def _normalize_stages(stages: list[list[Any]]) -> list[list[Any]]:
    """planner output 을 depends_on_agents 기반 위상 정렬 (Kahn 변형).

    planner 의 stage 분할은 무시하고 depends_on_agents 만 신뢰 — 독립 tasks 는 같은
    stage 로 병합, 진짜 순차 의존성만 stage 분리 보존. 순환 의존성 발견 시 남은
    tasks 를 마지막 stage 에 일괄 배치 (안전망).
    """
    all_tasks = [t for stage in stages for t in stage]
    if not all_tasks:
        return []

    def _deps_of(t: Any) -> list[str]:
        deps = getattr(t, "depends_on_agents", None)
        if deps is None and isinstance(t, dict):
            deps = t.get("depends_on_agents", [])
        return list(deps or [])

    def _agent_of(t: Any) -> str:
        return getattr(t, "agent_name", None) or (t.get("agent_name", "") if isinstance(t, dict) else "")

    pending = list(all_tasks)
    completed_agents: set[str] = set()
    normalized: list[list[Any]] = []

    while pending:
        ready = [t for t in pending if all(d in completed_agents for d in _deps_of(t))]
        if not ready:
            logger.warning("[_normalize_stages] 순환 또는 미해결 의존성 — %d tasks를 마지막 stage로", len(pending))
            normalized.append(pending)
            break
        normalized.append(ready)
        for t in ready:
            completed_agents.add(_agent_of(t))
        pending = [t for t in pending if t not in ready]

    return normalized


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


# ─────────────────────────────────────────────────────────
# Graph 빌더 (노드는 클로저로 LLM/에이전트 캡처)
# ─────────────────────────────────────────────────────────


def build_plan_execute_graph(
    planner_llm,
    generator_llm,
    agents: dict,
    agent_timeout: float = 90.0,
    agent_max_retries: int = 0,
    agent_retry_delay: float = 1.0,
    agent_descriptions: dict[str, str] | None = None,
    *,
    plan_timeout_s: float = 60.0,
    answer_timeout_s: float = 180.0,
    react_recursion_limit: int = 20,
    clarifier_llm=None,
    clarify_timeout_s: float = 15.0,
    enable_clarify: bool = True,
    guardrail_fn=None,
    guardrail_llm=None,
    enable_guardrail: bool = True,
    replanner_llm=None,
    max_replan: int = 2,
    map_reduce_domain_threshold: int = 3,
    map_concurrency: int = 2,
    map_timeout_s: float = 50.0,
    reduce_mode: str = "full",
    writer_llm=None,
):
    """Plan-then-Execute StateGraph 빌드.

    Args:
        planner_llm: 계획 생성 LLM (with_structured_output 지원 필요)
        generator_llm: 최종 답변 생성 LLM
        agents: {에이전트 이름: 에이전트 객체} — keys() 로 동적 스키마 생성, 런타임 확장 가능
        agent_descriptions: 주어지면 PLAN_SYSTEM 의 에이전트 목록 섹션을 동적 구성
        clarifier_llm: Clarification 노드용 LLM. None 이면 planner_llm 재사용
        enable_clarify: True 면 START→clarify→[plan|END], False 면 START→plan
        guardrail_fn: 보안 판정 함수(check_guardrail) — 서비스가 주입(graphs→services 역의존 회피)
        guardrail_llm: 보안검사 노드용 LLM. None 이면 planner_llm 재사용
        enable_guardrail: True 면 진입 노드가 보안검사(차단 시 END). 현재 질문만 검사(히스토리 격리)
        replanner_llm: 재계획 노드용 LLM (빠른 router 권장). None 이면 planner_llm 재사용
        max_replan: 재계획으로 추가 가능한 stage 횟수 상한 (무한 루프 방지)
        map_reduce_domain_threshold: 활성 도메인 수가 이 값 이상이면 map_answer→reduce 경로
        writer_llm: 주어지면 Map 단계가 tool evidence 기반 Writer 권한 분리로 동작
                    (MA_WRITER_AS_MAP=false 환경변수로 비상 우회 가능)
    """
    # 동적 Pydantic 스키마 — agents.keys() 를 description 에 포함해 LLM 라우팅 정확도 향상.
    # 런타임 Literal 생성은 불안정해 str 사용.
    agent_names_str = ", ".join(sorted(agents.keys()))

    class _StageTask(BaseModel):
        agent_name: str = Field(description=f"호출할 에이전트 이름. 반드시 다음 중 하나: {agent_names_str}")
        task: str = Field(
            description=(
                "에이전트에게 전달할 완전한 작업 지시문 (원래 질문의 구체적 맥락 포함, 30자 이상). "
                "financials_domain: 첫 단어에 조사 유형 표시 후 구체적 주제 서술. "
                "예) '재무 분석: 삼성전자 최근 분기 매출·영업이익 및 영업이익률 추이'. "
                "risk_domain: 첫 단어에 분석 유형 표시 후 종목·지표 서술. "
                "이전 stage 결과 활용 시 '이전 [에이전트명] 결과 기반으로' 형태로 연결."
            )
        )
        depends_on_agents: list[str] = Field(
            default_factory=list,
            description="선행 에이전트 이름 리스트. 다른 에이전트 결과가 본 task 입력에 필요하면 명시. 독립 task는 [].",
        )

    class _ExecutionPlan(BaseModel):
        reasoning: str = Field(description="계획 수립 근거 (어떤 에이전트를 왜, 어떤 순서로 호출하는지)")
        stages: list[list[_StageTask]] = Field(
            description="실행 단계 목록. 각 stage 내 tasks는 병렬 실행, stages 간은 순차 실행. 도메인 외 질문이면 빈 리스트 []."
        )

    _planner = planner_llm.with_structured_output(_ExecutionPlan)
    _agents = agents
    _timeout = agent_timeout
    _max_retries = agent_max_retries
    _retry_delay = agent_retry_delay

    if agent_descriptions:
        agent_list_lines = "\n".join(f"- {name:<22}: {desc}" for name, desc in agent_descriptions.items())
        _plan_system = PLAN_SYSTEM_TEMPLATE.format(agents_section=agent_list_lines)
    else:
        _plan_system = PLAN_SYSTEM

    _clarifier_llm = clarifier_llm if clarifier_llm is not None else planner_llm
    _clarifier = _clarifier_llm.with_structured_output(ClarifyDecision)

    _guardrail_llm = guardrail_llm if guardrail_llm is not None else planner_llm

    class _ReplanDecision(BaseModel):
        done: bool = Field(description="지금까지 결과로 사용자 질문에 충분히 답할 수 있으면 True (종료)")
        reason: str = Field(description="판단 근거 한 문장 (trace 가독용)")
        next_stage: list[_StageTask] = Field(
            default_factory=list,
            description=(
                "done=False 일 때만: 다음에 실행할 stage. 직전 결과에 담긴 식별자(공시 접수번호·종목코드·기관명 등)를 "
                "그 식별자에 맞는 도구를 가진 에이전트가 이어받아 조사하도록 task 를 작성. 보통 1개."
            ),
        )

    _replanner_llm = replanner_llm if replanner_llm is not None else planner_llm
    _replanner = _replanner_llm.with_structured_output(_ReplanDecision)
    if agent_descriptions:
        _replan_system = REPLAN_SYSTEM_TEMPLATE.format(agents_section=agent_list_lines)
    else:
        _replan_system = REPLAN_SYSTEM

    async def _guardrail_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """보안 게이트(첫 노드) — 프롬프트 인젝션·유해 요청 차단. fail-open.

        ⚠️ 히스토리 격리: 현재 질문만 검사한다(state messages 의 누적 대화 미전달) —
        멀티턴 사회공학("아까 허락했잖아") 인젝션을 막기 위한 불변. clarify(히스토리 참조)와 정반대 계약.
        """
        from langchain_core.messages import AIMessage

        if not enable_guardrail or guardrail_fn is None:
            return {"guardrail_blocked": False}

        query = _extract_query(state["messages"])
        verdict = await guardrail_fn(query, _guardrail_llm, enabled=True, config={**config, "run_name": "보안 검사"})
        if verdict.is_safe:
            return {"guardrail_blocked": False}

        refusal = verdict.refusal_message
        logger.info("[guardrail] 차단 (category=%s)", verdict.category or "?")
        return {
            "guardrail_blocked": True,
            "refusal_message": refusal,
            "messages": [AIMessage(content=refusal)],
            "final_answer": refusal,
        }

    def _route_after_guardrail(state: PlanExecuteState) -> str:
        if state.get("guardrail_blocked"):
            return END
        return "보충질문확인" if enable_clarify else "계획수립"

    async def _clarify_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """쿼리의 금융·투자 도메인 적합성·모호성·논리적 가능성을 판단."""
        from langchain_core.messages import AIMessage

        query = _extract_query(state["messages"])
        history_ctx = _build_history_ctx(state["messages"], k=20)

        refused_topics = state.get("refused_topics") or []
        refused_ctx = ""
        if refused_topics:
            refused_ctx = f"\n\n[이전 거절 주제]\n{', '.join(refused_topics)}\n동일 컨텍스트 후속 질의는 refuse 유지."

        user_part = (
            (f"[이전 대화]\n{history_ctx}\n\n" if history_ctx else "")
            + (refused_ctx.strip() + "\n\n" if refused_ctx else "")
            + f"[현재 질문]\n{query}"
        )

        try:
            decision: ClarifyDecision = await asyncio.wait_for(
                _clarifier.ainvoke(
                    build_node_messages(CLARIFY_SYSTEM, user=user_part),
                    config={**config, "run_name": "보충질문 판단"},
                ),
                timeout=clarify_timeout_s,
            )
        except Exception as e:
            logger.warning("clarify_node 실패 — proceed로 폴백: %s", e)
            return {"clarify_intent": "proceed", "clarification_question": None, "refusal_message": None}

        intent = decision.intent.lower().strip()
        if intent not in ("proceed", "clarify", "refuse"):
            logger.warning("clarify_node 알 수 없는 intent '%s' — proceed로 폴백", intent)
            return {"clarify_intent": "proceed", "clarification_question": None, "refusal_message": None}

        if intent == "clarify":
            question = decision.question.strip() or "질문을 좀 더 구체적으로 알려주실 수 있을까요?"
            logger.info("[clarify] 명확화 요청: %s", question[:100])
            return {
                "clarify_intent": "clarify",
                "clarification_question": question,
                "refusal_message": None,
                "messages": [AIMessage(content=question)],
                "final_answer": question,
            }

        if intent == "refuse":
            parts = [decision.refusal_reason.strip()]
            if decision.suggestion.strip():
                parts.append(decision.suggestion.strip())
            refusal = "\n".join(p for p in parts if p) or "죄송하지만 이 질문은 금융·투자 리서치 답변 범위를 벗어납니다."
            logger.info("[clarify] 거절: %s", refusal[:100])
            prev_refused = state.get("refused_topics") or []
            new_refused = list(prev_refused) + [query[:120]]
            return {
                "clarify_intent": "refuse",
                "clarification_question": None,
                "refusal_message": refusal,
                "messages": [AIMessage(content=refusal)],
                "final_answer": refusal,
                "refused_topics": new_refused,
            }

        logger.debug("[clarify] proceed — plan으로 전달")
        return {"clarify_intent": "proceed", "clarification_question": None, "refusal_message": None}

    def _route_after_clarify(state: PlanExecuteState) -> str:
        intent = state.get("clarify_intent") or "proceed"
        return "계획수립" if intent == "proceed" else END

    async def _plan_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """LLM → ExecutionPlan 구조화 출력."""
        query = _extract_query(state["messages"])
        history_ctx = _build_history_ctx(state["messages"], k=20)

        user_part = (f"[이전 대화]\n{history_ctx}\n\n" if history_ctx else "") + f"[현재 질문]\n{query}"

        try:
            plan: ExecutionPlan = await asyncio.wait_for(
                _planner.ainvoke(
                    build_node_messages(_plan_system, user=user_part),
                    config={**config, "run_name": "계획 수립"},
                ),
                timeout=plan_timeout_s,
            )
        except Exception as e:
            logger.error("plan_node 실패 [%s]: %r", type(e).__name__, e)
            plan = ExecutionPlan(stages=[])

        normalized = _normalize_stages(plan.stages)
        if len(normalized) != len(plan.stages):
            logger.info("[plan] stage 위상 정렬: planner=%d → normalized=%d", len(plan.stages), len(normalized))
        logger.info("[plan] stages=%d", len(normalized))
        return {
            "plan": plan,
            "stage_results": [],
            "agent_calls": [],
            "tool_calls": [],
            "pending_stages": normalized,
            "replan_count": 0,
        }

    async def _run_stage_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """pending_stages 큐에서 stage 1개만 pop 해 실행 (stage 내 tasks 는 asyncio.gather 병렬).

        실행·계획 분리: 이 노드는 '실행'만 담당하고, 다음 stage 유무·재배정 판단은 _replan_node 가 한다.
        결과는 stage_results 에 누적하고, 남은 큐는 pending_stages 로 돌려 그래프 edge 가 루프를 돈다.
        """
        try:
            from langgraph.config import get_stream_writer

            sa_stream_writer = get_stream_writer()
        except Exception:
            sa_stream_writer = None

        pending: list = list(state.get("pending_stages") or [])
        all_results: list[dict] = list(state.get("stage_results") or [])
        agent_calls: list[str] = list(state.get("agent_calls") or [])
        tool_calls_sink: list[dict[str, Any]] = list(state.get("tool_calls") or [])

        if not pending:
            return {
                "stage_results": all_results,
                "agent_calls": agent_calls,
                "tool_calls": tool_calls_sink,
                "pending_stages": [],
            }

        stage_tasks = pending.pop(0)
        stage_idx = len(all_results)
        original_query = _extract_query(state["messages"])
        prior_ctx = _format_prior_stage_results(all_results, tool_calls_sink)

        coros = []
        valid_tasks = []
        for task_item in stage_tasks:
            agent = _agents.get(task_item.agent_name)
            if agent is None:
                logger.warning("알 수 없는 에이전트: %s", task_item.agent_name)
                continue
            # 원본 쿼리를 항상 포함 — 플래너가 짧은 task 를 생성해도 도메인 에이전트가 검색 맥락 확보
            enriched_task = f"[원래 질문]\n{original_query}\n\n[이 단계 작업]\n{task_item.task}"
            if prior_ctx:
                enriched_task += f"\n\n[이전 단계 결과 참고]\n{prior_ctx}"
            coros.append(
                _invoke_agent_safe(
                    agent,
                    enriched_task,
                    task_item.agent_name,
                    timeout=_timeout,
                    max_retries=_max_retries,
                    retry_delay=_retry_delay,
                    react_recursion_limit=react_recursion_limit,
                    tool_trace_sink=tool_calls_sink,
                    stream_writer=sa_stream_writer,
                )
            )
            valid_tasks.append(task_item)
            agent_calls.append(task_item.agent_name)

        if not coros:
            return {
                "stage_results": all_results,
                "agent_calls": agent_calls,
                "tool_calls": tool_calls_sink,
                "pending_stages": pending,
            }

        outputs: list[Any] = await asyncio.gather(*coros, return_exceptions=True)
        results_list: list[dict] = []
        for t, o in zip(valid_tasks, outputs, strict=False):
            if isinstance(o, AgentResult):
                rec = o.to_legacy_dict()
            elif isinstance(o, Exception):
                rec = AgentResult.exception(agent=t.agent_name, task=t.task, exc=o).to_legacy_dict()
            else:  # 방어: 구버전 str 반환 호환
                rec = {
                    "agent": t.agent_name,
                    "task": t.task,
                    "output": str(o),
                    "status": "ok",
                    "error_type": "",
                    "elapsed_s": 0.0,
                    "group": -1,
                }
            # enriched(원본질문+이전결과 포함) 대신 계획 task 원문을 보존 — trace 가독 + 재계획 중복 판정 키
            rec["task"] = t.task
            results_list.append(rec)
        all_results.append({"stage": stage_idx, "results": results_list})
        success_domains = [r["agent"] for r in results_list if r.get("status") == "ok"]
        failed_domains = [f"{r['agent']}({r.get('status')})" for r in results_list if r.get("status") != "ok"]
        logger.info(
            "[execute] stage %d 완료: 성공=%s 실패=%s (남은 큐 %d)",
            stage_idx,
            success_domains,
            failed_domains or "(없음)",
            len(pending),
        )

        return {
            "stage_results": all_results,
            "agent_calls": agent_calls,
            "tool_calls": tool_calls_sink,
            "pending_stages": pending,
        }

    async def _replan_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """별도 '재계획' 노드 — 직전 결과를 보고 순차 의존 후속 stage 를 동적으로 추가한다.

        pending_stages 가 남아 있으면(계획된 stage) LLM 호출 없이 통과. 비어 있고 상한 미만일 때만
        직전 결과+팀별 역량을 router LLM 으로 판단해, 새 식별자 기반 후속 조사를 적합한 팀에 배정한다.
        상한 3중: ReplanDecision.done + replan_count<max_replan + 중복 (agent, task) 차단.
        """
        try:
            from langgraph.config import get_stream_writer

            _stream_writer = get_stream_writer()
        except Exception:
            _stream_writer = None

        def _signal_done() -> dict:
            """실행 종료(더 이상 stage 없음) 신호 — 서비스가 media·답변시작 이벤트를 이 시점에 flush."""
            if _stream_writer is not None:
                try:
                    _stream_writer({"event": "execution_complete"})
                except Exception as exc:
                    logger.debug("[replan] execution_complete push 실패: %s", exc)
            return {}

        pending = state.get("pending_stages") or []
        if pending:
            return {}  # 계획된 stage 가 남음 — 그대로 다음 실행으로 통과 (실행 종료 아님)

        replan_count = state.get("replan_count") or 0
        stage_results = state.get("stage_results") or []
        if replan_count >= max_replan:
            logger.info("[replan] 상한 도달 (count=%d, max=%d) — 종료", replan_count, max_replan)
            return _signal_done()
        if not stage_results:
            return _signal_done()  # 실행 결과 없음 — 재계획 무의미

        tool_calls = state.get("tool_calls") or []
        prior_ctx = _format_prior_stage_results(stage_results, tool_calls)
        if not prior_ctx:
            return _signal_done()  # 성공 결과 없음 — 추가 조사 근거 없음

        query = _extract_query(state["messages"])
        executed_keys = {(r.get("agent"), r.get("task")) for st in stage_results for r in st.get("results", [])}
        executed_agents = sorted(
            {r.get("agent") for st in stage_results for r in st.get("results", []) if r.get("agent")}
        )
        user_part = REPLAN_USER_TEMPLATE.format(
            query=query, executed=", ".join(executed_agents) or "(없음)", prior=prior_ctx
        )

        try:
            decision = await asyncio.wait_for(
                _replanner.ainvoke(
                    build_node_messages(_replan_system, user=user_part),
                    config={**config, "run_name": "재계획 판단"},
                ),
                timeout=plan_timeout_s,
            )
        except Exception as e:
            logger.warning("[replan] 판단 실패 — 종료로 폴백: %s", e)
            return _signal_done()

        if decision.done or not decision.next_stage:
            logger.info("[replan] done=%s — 종료 (%s)", decision.done, (decision.reason or "")[:80])
            return _signal_done()

        valid = []
        for t in decision.next_stage:
            if t.agent_name not in _agents:
                logger.warning("[replan] 알 수 없는 에이전트 %s 무시", t.agent_name)
                continue
            if (t.agent_name, t.task) in executed_keys:
                logger.info("[replan] 중복 stage (%s) 무시", t.agent_name)
                continue
            valid.append(t)
        if not valid:
            logger.info("[replan] 추가할 신규 task 없음 — 종료")
            return _signal_done()

        normalized = _normalize_stages([valid])
        logger.info(
            "[replan] 추가 stage: %s (replan_count %d→%d, %s)",
            [t.agent_name for t in valid],
            replan_count,
            replan_count + 1,
            (decision.reason or "")[:80],
        )
        return {"pending_stages": normalized, "replan_count": replan_count + 1}

    async def _answer_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """수집된 결과로 최종 답변 생성. stage_results 가 비어있으면 history 기반 종합."""
        from langchain_core.messages import AIMessage

        query = _extract_query(state["messages"])
        stage_results = state.get("stage_results") or []
        context = _format_all_results_for_answer(stage_results)

        history_ctx = _build_history_ctx(state["messages"], k=20)

        refused_topics = state.get("refused_topics") or []
        refused_str = ", ".join(refused_topics) if refused_topics else "(없음)"

        if not stage_results and history_ctx:
            messages = build_node_messages(
                SYNTHESIS_SYSTEM, user_template=SYNTHESIS_USER_TEMPLATE, query=query, history=history_ctx
            )
        elif history_ctx:
            merged = f"[이전 턴 누적 컨텍스트]\n{history_ctx}\n\n[현재 턴 신규 수집 결과]\n{context}"
            messages = build_node_messages(
                ANSWER_SYSTEM,
                user_template=ANSWER_USER_TEMPLATE,
                query=query,
                context=merged,
                refused_topics=refused_str,
            )
        else:
            messages = build_node_messages(
                ANSWER_SYSTEM,
                user_template=ANSWER_USER_TEMPLATE,
                query=query,
                context=context,
                refused_topics=refused_str,
            )

        try:
            ans = await asyncio.wait_for(
                generator_llm.ainvoke(messages, config={**config, "run_name": "답변 작성"}),
                timeout=answer_timeout_s,
            )
            final_answer = ans.content if hasattr(ans, "content") else str(ans)
            final_answer = _ensure_disclaimer(final_answer)
        except Exception as e:
            logger.error("answer_node 실패: %s", e)
            final_answer = "답변 생성 중 일시 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

        # env-gated answer_node 진단 로깅
        if os.getenv("MA_TRACE_ANSWER_NODE", "").lower() == "true":
            trace = {
                "query": query,
                "stage_results_count": len(stage_results),
                "prompt_context_preview": context[:500],
                "final_answer_preview": final_answer[:500],
            }
            logger.info("MA_TRACE_ANSWER_NODE: %s", json.dumps(trace, ensure_ascii=False))

        return {"final_answer": final_answer, "messages": [AIMessage(content=final_answer)]}

    # ──────────────────────────────────────────────────
    # Hierarchical Map-Reduce 노드
    # ──────────────────────────────────────────────────

    def _route_after_execute(state: PlanExecuteState) -> str:
        """stage_results 의 활성 도메인 수로 분기 — 임계 이상이면 Map-Reduce, 미만이면 single answer."""
        stage_results = state.get("stage_results") or []
        active_domains = _count_active_domains(stage_results)
        if active_domains >= map_reduce_domain_threshold:
            logger.info("[route] map_reduce 경로 진입: %d 활성 도메인", active_domains)
            return "도메인별답변"
        return "답변작성"

    def _route_after_replan(state: PlanExecuteState) -> str:
        """재계획 후 분기 — 실행 대기 stage 가 있으면 단계실행 루프, 없으면 답변 경로로."""
        if state.get("pending_stages"):
            return "도메인실행"
        return _route_after_execute(state)

    def _emit_map_completed(stream_writer: Any, result: dict[str, Any]) -> None:
        """도메인 sub-answer 완료 SSE chunk push (best-effort). OK·FAILED 공통."""
        if stream_writer is None:
            return
        try:
            stream_writer(
                {
                    "event": "map_domain_completed",
                    "domain": result["domain"],
                    "domain_label": result["domain_label"],
                    "narrative": result["narrative"],
                    "status": result["status"],
                }
            )
        except Exception as e:
            logger.debug("[map] stream_writer push 실패 (%s)", e)

    def _make_map_failed(domain: str, domain_label: str, reason: str, agent_count: int) -> dict[str, Any]:
        """Map 실패 stub. reason='timeout'|'exception' — Reduce 가 자연어로 흡수."""
        suffix = " (timeout)" if reason == "timeout" else ""
        return {
            "status": "FAILED",
            "domain": domain,
            "domain_label": domain_label,
            "stub": f"[DOMAIN_FAILED:{domain}:{reason}]",
            "narrative": f"<{domain_label} 도메인 정보 일시 수집 불가{suffix}>",
            "agent_count": agent_count,
        }

    async def _map_domain_answer(
        domain: str,
        domain_items: list[dict],
        query: str,
        config: RunnableConfig,
        semaphore: asyncio.Semaphore,
        stream_writer: Any = None,
        tool_calls_for_domain: list[dict] | None = None,
    ) -> dict[str, Any]:
        """단일 도메인 sub-answer 생성. Semaphore 로 동시성 제한. 실패 시 메타 stub 반환."""
        tool_calls_for_domain = tool_calls_for_domain or []
        async with semaphore:
            domain_label = _DOMAIN_LABELS.get(domain, domain)
            domain_results_text = _format_domain_results(domain_items)

            # Writer-as-Map: writer_llm 주입 시 항상 활성. MA_WRITER_AS_MAP=false 로 비상 우회.
            use_writer = writer_llm is not None and os.getenv("MA_WRITER_AS_MAP", "true").lower() != "false"
            if use_writer:
                domain_evidence_blocks = [
                    f"[tool={tc.get('tool', '?')}] input={tc.get('input', '')}\noutput=\n{tc.get('output', '')}"
                    for tc in tool_calls_for_domain
                ]
                tool_evidence = join_tool_evidence(domain_evidence_blocks)
                writer_task = (
                    f"투자 리서치 도메인 답변 작성 — 분야: {domain_label}\n\n"
                    f"사용자 질문: {query}\n\n"
                    f"이전 sub-agent들의 도메인 답변 (참고):\n{domain_results_text}\n\n"
                    f"위 사용자 질문에 대해 {domain_label} 분야 관점에서 800-1500자 자연 narrative로 답변. "
                    "헤더·메타 표현 없이 자연스럽게 시작."
                )
                messages = build_node_messages(
                    _WRITER_SYSTEM, user_template=_WRITER_USER_TEMPLATE, task=writer_task, tool_evidence=tool_evidence
                )
                llm_to_use = writer_llm
            else:
                messages = build_node_messages(
                    MAP_DOMAIN_SYSTEM.format(domain_name=domain_label),
                    user_template=MAP_DOMAIN_USER_TEMPLATE,
                    query=query,
                    domain_results=domain_results_text,
                )
                llm_to_use = generator_llm

            t0 = time.monotonic()
            try:
                ans = await asyncio.wait_for(
                    llm_to_use.ainvoke(messages, config={**config, "run_name": "도메인 답변 작성"}),
                    timeout=map_timeout_s,
                )
                narrative = ans.content if hasattr(ans, "content") else str(ans)
                elapsed = round(time.monotonic() - t0, 2)
                logger.info("[map] %s 완료 (%ss, %d자)", domain, elapsed, len(narrative))
                result = {
                    "status": "OK",
                    "domain": domain,
                    "domain_label": domain_label,
                    "narrative": narrative,
                    "elapsed_s": elapsed,
                    "agent_count": len(domain_items),
                }
                _emit_map_completed(stream_writer, result)
                return result
            except TimeoutError:
                logger.warning("[map] %s 타임아웃 (%.1fs)", domain, map_timeout_s)
                result = _make_map_failed(domain, domain_label, "timeout", len(domain_items))
                _emit_map_completed(stream_writer, result)
                return result
            except Exception as e:
                logger.error("[map] %s 실패: %s", domain, e)
                result = _make_map_failed(domain, domain_label, "exception", len(domain_items))
                _emit_map_completed(stream_writer, result)
                return result

    async def _map_answer_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """Map 단계: 도메인별 sub-answer 를 병렬 LLM 호출로 생성 (완료 즉시 SSE chunk push)."""
        try:
            from langgraph.config import get_stream_writer

            stream_writer = get_stream_writer()
        except Exception:
            stream_writer = None

        query = _extract_query(state["messages"])
        stage_results = state.get("stage_results") or []

        grouped = _group_results_by_domain(stage_results)
        # 4 도메인만 대상. 'other'는 reduce 가 별도 처리하지 않음 (stage_results 원본 보존).
        target_domains = [(domain, items) for domain, items in grouped.items() if domain in _DOMAIN_LABELS and items]
        if not target_domains:
            logger.warning("[map] 대상 도메인 없음 — answer_node 폴백 필요")
            return {"domain_answers": {}}

        if stream_writer is not None:
            try:
                stream_writer({"event": "map_started", "domains": [d for d, _ in target_domains]})
            except Exception:
                pass

        semaphore = asyncio.Semaphore(map_concurrency)

        # Writer-as-Map: tool_calls trace 를 도메인별로 그룹핑하여 전달
        tool_calls_state = state.get("tool_calls") or []
        tool_calls_by_domain: dict[str, list[dict]] = {}
        for tc in tool_calls_state:
            tc_domain = _classify_domain(tc.get("agent", ""))
            if tc_domain:
                tool_calls_by_domain.setdefault(tc_domain, []).append(tc)

        coros = [
            _map_domain_answer(
                domain,
                items,
                query,
                config,
                semaphore,
                stream_writer,
                tool_calls_for_domain=tool_calls_by_domain.get(domain, []),
            )
            for domain, items in target_domains
        ]
        results = await asyncio.gather(*coros, return_exceptions=False)

        domain_answers: dict[str, dict[str, Any]] = {r["domain"]: r for r in results}
        logger.info(
            "[map] 완료: %d 도메인 (OK=%d, FAILED=%d)",
            len(domain_answers),
            sum(1 for r in results if r["status"] == "OK"),
            sum(1 for r in results if r["status"] == "FAILED"),
        )
        return {"domain_answers": domain_answers}

    def _build_sub_answers_section(domain_answers: dict[str, dict]) -> str:
        """도메인별 sub-answer 를 메타 마크업 없이 빈 줄로 분리해 사용자 응답 본문으로 포맷."""
        domain_order = ["instrument", "financials", "risk", "market"]
        ordered = sorted(
            domain_answers.items(),
            key=lambda kv: domain_order.index(kv[0]) if kv[0] in domain_order else 99,
        )
        return _ensure_disclaimer("\n\n".join(ans.get("narrative", "") for _, ans in ordered))

    def _build_brief_summaries(domain_answers: dict[str, dict]) -> str:
        """Reduce LLM 입력용 — 영역별 sub-answer 풀텍스트 전달 (truncation 없음)."""
        lines = []
        for domain, ans in domain_answers.items():
            label = ans.get("domain_label") or _DOMAIN_LABELS.get(domain, domain)
            status = ans.get("status", "OK")
            narrative = ans.get("narrative", "")
            if status == "OK":
                lines.append(f"[{label}]\n{narrative}")
            else:
                lines.append(f"[{label}] (수집 실패)\n{narrative}")
        return "\n\n".join(lines)

    async def _reduce_node(state: PlanExecuteState, config: RunnableConfig) -> dict:
        """Full Reduce: 도메인 sub-answer 들을 input 으로 단일 통합 답변 생성.

        sub-answer 는 internal state 로만 활용 — final_answer 가 사용자에게 보일 유일한 답변.
        Reduce LLM 실패 시 sub-answer concat 폴백 (응답 0자 방지).
        """
        from langchain_core.messages import AIMessage

        query = _extract_query(state["messages"])
        domain_answers = state.get("domain_answers") or {}

        if not domain_answers:
            # _map_answer_node 가 빈 결과 반환했거나 라우팅 오류 — single answer 폴백.
            logger.warning("[reduce] domain_answers 비어있음 — single answer 폴백")
            stage_results = state.get("stage_results") or []
            context = _format_all_results_for_answer(stage_results)
            history_ctx = _build_history_ctx(state["messages"], k=20)
            refused_str = ", ".join(state.get("refused_topics") or []) or "(없음)"
            if history_ctx:
                merged = f"[이전 턴 누적 컨텍스트]\n{history_ctx}\n\n[현재 턴 신규 수집 결과]\n{context}"
                messages = build_node_messages(
                    ANSWER_SYSTEM,
                    user_template=ANSWER_USER_TEMPLATE,
                    query=query,
                    context=merged,
                    refused_topics=refused_str,
                )
            else:
                messages = build_node_messages(
                    ANSWER_SYSTEM,
                    user_template=ANSWER_USER_TEMPLATE,
                    query=query,
                    context=context,
                    refused_topics=refused_str,
                )
            try:
                ans = await asyncio.wait_for(
                    generator_llm.ainvoke(messages, config={**config, "run_name": "답변 통합"}),
                    timeout=answer_timeout_s,
                )
                fallback_answer = _ensure_disclaimer(ans.content if hasattr(ans, "content") else str(ans))
            except Exception as e:
                logger.error("[reduce] 폴백 single answer 실패: %s", e)
                fallback_answer = "답변 생성 중 일시 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            return {"final_answer": fallback_answer, "messages": [AIMessage(content=fallback_answer)]}

        if reduce_mode == "disabled":
            final_answer = _build_sub_answers_section(domain_answers)
            logger.info("[reduce] mode=disabled — sub-answer concat만")
            return {"final_answer": final_answer, "messages": [AIMessage(content=final_answer)]}

        sub_answers_input = _build_brief_summaries(domain_answers)
        reduce_messages = build_node_messages(
            REDUCE_SYSTEM, user_template=REDUCE_USER_TEMPLATE, query=query, domain_summaries_brief=sub_answers_input
        )
        try:
            ans = await asyncio.wait_for(
                generator_llm.ainvoke(reduce_messages, config={**config, "run_name": "답변 통합"}),
                timeout=answer_timeout_s,  # full reduce 는 sub-answer 들을 합치므로 answer_timeout 공유
            )
            final_answer = _ensure_disclaimer(ans.content if hasattr(ans, "content") else str(ans))
            logger.info("[reduce] 통합 답변 완료 (%d자)", len(final_answer))
        except Exception as e:
            logger.warning("[reduce] 통합 실패 — sub-answer concat 폴백: %s", e)
            final_answer = _build_sub_answers_section(domain_answers)

        return {"final_answer": final_answer, "messages": [AIMessage(content=final_answer)]}

    # trace 가독을 위한 한글 노드명. 라우터(조건분기)는 함수명은 영어로 두고 trace 표시명만 __name__ 으로 한글화.
    _route_after_guardrail.__name__ = "보안검사_분기"
    _route_after_clarify.__name__ = "보충질문_분기"
    _route_after_execute.__name__ = "답변경로_분기"
    _route_after_replan.__name__ = "재계획_분기"
    graph = StateGraph(PlanExecuteState)
    graph.add_node("계획수립", _plan_node)
    graph.add_node("도메인실행", _run_stage_node)
    graph.add_node("재계획", _replan_node)
    graph.add_node("답변작성", _answer_node)
    graph.add_node("도메인별답변", _map_answer_node)
    graph.add_node("답변통합", _reduce_node)
    if enable_clarify:
        graph.add_node("보충질문확인", _clarify_node)
        graph.add_conditional_edges("보충질문확인", _route_after_clarify, {"계획수립": "계획수립", END: END})

    # 진입 노드 체인: (보안검사) → (보충질문확인) → 계획수립. 게이트는 차단 시 END.
    _entry_after_gate = "보충질문확인" if enable_clarify else "계획수립"
    if enable_guardrail:
        graph.add_node("보안검사", _guardrail_node)
        graph.add_edge(START, "보안검사")
        graph.add_conditional_edges(
            "보안검사", _route_after_guardrail, {_entry_after_gate: _entry_after_gate, END: END}
        )
    else:
        graph.add_edge(START, _entry_after_gate)
    graph.add_edge("계획수립", "도메인실행")
    graph.add_edge("도메인실행", "재계획")
    graph.add_conditional_edges(
        "재계획",
        _route_after_replan,
        {"도메인실행": "도메인실행", "답변작성": "답변작성", "도메인별답변": "도메인별답변"},
    )
    graph.add_edge("답변작성", END)
    graph.add_edge("도메인별답변", "답변통합")
    graph.add_edge("답변통합", END)

    return graph.compile()
