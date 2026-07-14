"""프롬프트 컨텍스트 포매팅 — 쿼리 추출·히스토리·이전 stage 결과 텍스트화.

redact_operational_info 는 tool 출력·sub-agent 결과를 context 에 넣기 직전 적용 (운영정보 마스킹).
"""

from __future__ import annotations

from langchain_core.messages import HumanMessage
from utils.redaction.redactor import redact_operational_info


def _extract_query(messages: list) -> str:
    """State messages 에서 마지막 사용자 쿼리 추출."""
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            return m.content.strip()
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
