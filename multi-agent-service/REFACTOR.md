# plan_execute.py 분해 리팩터링 보고서

## 개요

`multi-agent-service/app/graphs/plan_execute.py`(1,324줄)을 Python 패키지 `graphs/plan_execute/`로 분해했다.  
외부 계약 `from graphs.plan_execute import COMPLIANCE_DISCLAIMER, build_plan_execute_graph` 는 그대로 동작한다.

## 분해 경계 선택 이유

파일은 Pydantic 스키마 · State · tool-trace 콜백 · 프롬프트 컨텍스트 포맷 · 도메인 매핑·분류 · 컴플라이언스 · stage 위상 정렬 · sub-agent 실행 래퍼 · 그래프 조립부 등 9개 관심사로 구성된다. 이 경계로 자른 이유는 새 도메인 추가 시 손대야 하는 부분(`_DOMAIN_LABELS`, `_build_subagent_domain_map`)을 `domain_map.py`에 모으고, 나머지는 변경 빈도·의존 방향별로 격리해 가독성과 충돌 가능성을 낮추기 위해서다. 그래프 노드들은 `build_plan_execute_graph` 클로저가 `planner_llm`, `generator_llm`, `agents` 등을 캡처하므로 동작 보존을 최우선으로 같은 파일에 남겼다.

## 구 → 신 매핑표

| 기존 심볼 | 새 위치 | 비고 |
|---|---|---|
| `VALID_AGENTS` | `schemas.py` | |
| `StageTask` | `schemas.py` | |
| `ExecutionPlan` | `schemas.py` | |
| `ReplanDecision` | `schemas.py` | |
| `ClarifyDecision` | `schemas.py` | |
| `PlanExecuteState` | `state.py` | |
| `_tool_output_text` | `callbacks.py` | |
| `_ToolTraceCallback` | `callbacks.py` | |
| `_extract_query` | `formatting.py` | |
| `_build_history_ctx` | `formatting.py` | |
| `_format_prior_stage_results` | `formatting.py` | |
| `_format_all_results_for_answer` | `formatting.py` | |
| `_DOMAIN_LABELS` | `domain_map.py` | |
| `_build_subagent_domain_map` | `domain_map.py` | |
| `_SUBAGENT_DOMAIN_MAP` | `domain_map.py` | |
| `_classify_domain` | `domain_map.py` | |
| `_group_results_by_domain` | `domain_map.py` | |
| `_count_active_domains` | `domain_map.py` | |
| `_format_domain_results` | `domain_map.py` | |
| `COMPLIANCE_DISCLAIMER` | `compliance.py` | 공개 API |
| `_ensure_disclaimer` | `compliance.py` | |
| `_normalize_stages` | `stages.py` | |
| `_invoke_agent_safe` | `executor.py` | |
| `build_plan_execute_graph` | `builder.py` | 공개 API |

## 동작 보존 증명

LLM/MCP 키가 없어 그래프를 실행할 수 없으므로, **정적 AST 동등성 검증**으로 동작 보존을 증명했다.

1. `origin/main`의 `plan_execute.py` 소스를 `git show`로 가져온다.
2. 원본과 신규 패키지 모듈을 AST 파싱한다.
3. 원본의 최상위 함수/클스/상수 정의가 신규 모듈에 **본문 AST가 동일하게** 존재하는지 확인한다.
   - `lineno`, `col_offset` 등 위치 정보는 정규화 후 비교.
   - import 문·모듈 docstring은 비교 대상에서 제외.
4. `from graphs.plan_execute import COMPLIANCE_DISCLAIMER, build_plan_execute_graph` import 성공 확인.
5. `import graphs.plan_execute`로 순환 import·구문 오류 확인.
6. `ruff check` 통과 확인.

스크립트: `multi-agent-service/scripts/verify_plan_execute_refactor.py`

### 실행 결과

```text
============================================================
plan_execute.py refactoring static equivalence check
============================================================
Original definitions : 22
New definitions      : 23
Missing              : []
Mismatched AST body  : []
Extra in new package : ['__all__']
------------------------------------------------------------
AST equivalence: OK
Public import contract: OK
Package import sanity: OK
============================================================
RESULT: PASS
============================================================
```

```text
$ uv run ruff check app/graphs/plan_execute/ scripts/verify_plan_execute_refactor.py
All checks passed!
```

## 파일 크기

- 기존: `plan_execute.py` 1,324줄
- 신규: 10개 파일, 최대 `builder.py` 869줄

## 발견했지만 고치지 않은 버그/냄새

리팩터링 과정에서 본문 AST 동등성을 유지하려다 보니 별도의 버그는 발견하지 못했다.  
다만 `builder.py`가 여전히 869줄로 크다. 이는 그래프 노드들이 `build_plan_execute_graph` 클로저 변수를 캡처하기 때문이며, 노드를 외부로 꺼낼 경우 매개변수 전달 구조가 달라져 정적 동등성 증명이 약해지므로 이번 분해 범위에서는 의도적으로 남겼다.
