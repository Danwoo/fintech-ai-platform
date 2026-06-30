"""LLM 클라이언트 팩토리 — 외부타입(ChatOpenAI)이라 get_* 팩토리로 container 에 등록.

역할 분담 (example-ai-lab Phase 13/58 계측 결과):
    router_llm   : 소형 모델. sub-agent ReAct·RES route/evaluate·가드레일.
    planner_llm  : 소형 모델, temp=0. structured output(plan JSON)이 대형 모델에선 타임아웃.
    generator_llm: 대형 모델. 최종 답변·Reduce·Writer.
    evaluator_llm: 대형 모델, temp=0. clarify 판정 (생성과 평가 분리 — 자기평가 편향 방지).
"""

from langchain_openai import ChatOpenAI

# Qwen 계열 OpenAI 호환 서버의 reasoning 모드 비활성 (structured output 지연 방지)
_NO_THINKING = {"chat_template_kwargs": {"enable_thinking": False}}


def get_router_llm(config) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.ROUTER_LLM_BASE_URL,
        api_key=config.ROUTER_LLM_API_KEY,
        model=config.ROUTER_LLM_MODEL,
        temperature=0.0,
        max_tokens=4096,
        extra_body=_NO_THINKING,
    )


def get_planner_llm(config) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.ROUTER_LLM_BASE_URL,
        api_key=config.ROUTER_LLM_API_KEY,
        model=config.ROUTER_LLM_MODEL,
        temperature=0.0,
        max_tokens=4096,
        extra_body=_NO_THINKING,
    )


def get_generator_llm(config) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.GENERATOR_LLM_BASE_URL,
        api_key=config.GENERATOR_LLM_API_KEY,
        model=config.GENERATOR_LLM_MODEL,
        temperature=0.3,
        max_tokens=4096,
    )


def get_evaluator_llm(config) -> ChatOpenAI:
    return ChatOpenAI(
        base_url=config.GENERATOR_LLM_BASE_URL,
        api_key=config.GENERATOR_LLM_API_KEY,
        model=config.GENERATOR_LLM_MODEL,
        temperature=0.0,
        max_tokens=1024,
    )
