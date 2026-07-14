"""Plan-Execute Pydantic 스키마 + State (타입 힌트 / 정적 참조용).

실제 LLM 라우팅 스키마는 build_plan_execute_graph() 가 agents.keys() 로 동적 생성한다.
여기의 Literal 고정 모델은 타입 힌트·정적 참조 전용.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

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
