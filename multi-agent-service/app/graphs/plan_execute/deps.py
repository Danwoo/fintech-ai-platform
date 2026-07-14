"""그래프 노드가 공유하는 해결된 의존성 묶음 + 동적 라우팅 스키마 팩토리.

원래 build_plan_execute_graph() 가 클로저로 캡처하던 LLM·타임아웃·플래그를 한 곳에 모은다.
노드/라우터는 top-level 함수가 되고 이 _GraphDeps 를 첫 인자로 받아(functools.partial 바인딩)
그래프 구조(topology)는 그대로 유지하면서 클로저 캡처만 명시적 파라미터화한다.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from pydantic import BaseModel, Field


@dataclass(frozen=True)
class _GraphDeps:
    """노드/라우터가 참조하는 해결된(=기본값·폴백이 적용된) 의존성.

    필드는 원래 클로저가 캡처하던 로컬 변수와 1:1 대응 (동작 보존).
    """

    # 구조화 출력이 바인딩된 LLM
    planner: Any
    clarifier: Any
    replanner: Any
    # 원본 LLM / 콜러블
    generator_llm: Any
    guardrail_llm: Any
    guardrail_fn: Any
    writer_llm: Any
    # 에이전트 레지스트리 + 호출 파라미터
    agents: dict
    agent_timeout: float
    agent_max_retries: int
    agent_retry_delay: float
    react_recursion_limit: int
    # 프롬프트 (agent_descriptions 유무로 결정)
    plan_system: str
    replan_system: str
    # 타임아웃
    plan_timeout_s: float
    answer_timeout_s: float
    clarify_timeout_s: float
    map_timeout_s: float
    # 분기 플래그·임계값
    enable_clarify: bool
    enable_guardrail: bool
    max_replan: int
    map_reduce_domain_threshold: int
    map_concurrency: int
    reduce_mode: str


def _build_dynamic_schemas(agent_names_str: str) -> tuple[type[BaseModel], type[BaseModel], type[BaseModel]]:
    """agents.keys() 를 description 에 박아 LLM 라우팅 정확도를 높인 동적 Pydantic 스키마 3종.

    런타임 Literal 생성은 불안정해 str + description 으로 유효 이름을 안내한다.
    반환: (StageTask, ExecutionPlan, ReplanDecision) — planner/replanner 구조화 출력용.
    """

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

    return _StageTask, _ExecutionPlan, _ReplanDecision
