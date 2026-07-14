"""Plan-Execute 그래프 State 정의."""

from __future__ import annotations

from typing import Annotated, Any

from graphs.plan_execute.schemas import ExecutionPlan, StageTask
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


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
