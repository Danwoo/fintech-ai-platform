"""리포트 헬퍼 — 활동 수집·중복 정리·HTML 렌더.

IO/LLM/메일 없는 순수 함수.
"""

import html as html_lib

from schemas.report.report_schema import ActivitySummaries


def collect(activities: list[dict], member: dict) -> dict[str, list[str]]:
    """activity 목록에서 member 계좌분을 포트폴리오별 활동 설명으로 수집."""
    acc_id = str(member["account_id"]).lower()
    by_portfolio: dict[str, list[str]] = {}
    for a in activities:
        if acc_id == str(a.get("account_id", "")).lower():
            portfolio = a.get("portfolio") or a.get("account_name") or a["account_id"]
            by_portfolio.setdefault(portfolio, []).append(a["title"])
    return by_portfolio


def dedupe_common(by_portfolio: dict[str, list[str]]) -> dict[str, list[str]]:
    """포트폴리오 간 중복 활동을 '공통'으로 분리."""
    title_portfolios: dict[str, set[str]] = {}
    for portfolio, titles in by_portfolio.items():
        for t in titles:
            title_portfolios.setdefault(t, set()).add(portfolio)
    common = {t for t, pfs in title_portfolios.items() if len(pfs) >= 2}
    if not common:
        return by_portfolio
    result: dict[str, list[str]] = {"공통": []}
    for titles in by_portfolio.values():
        for t in titles:
            if t in common and t not in result["공통"]:
                result["공통"].append(t)
    for portfolio, titles in by_portfolio.items():
        remaining = [t for t in titles if t not in common]
        if remaining:
            result[portfolio] = remaining
    return result


def render_html(period: str, sections: list[tuple[str, ActivitySummaries]]) -> str:
    """구조화 요약 결과를 HTML 표 렌더. sections[1] 은 Pydantic 모델 (summaries 속성)."""
    td = "border:1px solid #ccc;padding:6px;vertical-align:top"
    th = "border:1px solid #ccc;padding:6px;background:#f3f3f3"
    blocks = ""
    for label, summaries in sections:
        rows = ""
        for ps in summaries.summaries:
            items_html = "<br>".join(f"- {html_lib.escape(it)}" for it in ps.items)
            rows += f"<tr><td style='{td}'>{html_lib.escape(ps.portfolio)}</td><td style='{td}'>{items_html}</td></tr>"
        header = f"<h3 style='margin:16px 0 6px'>{html_lib.escape(label)}</h3>" if len(sections) > 1 else ""
        blocks += (
            f"{header}<table style='border-collapse:collapse'>"
            f"<tr><th style='{th}'>포트폴리오</th><th style='{th}'>활동 요약</th></tr>{rows}</table>"
        )
    return (
        f"<p>포트폴리오 활동 요약입니다 ({period})</p>{blocks}"
        "<p style='color:#888;font-size:12px;margin-top:12px'>"
        "ⓘ 정보 제공 목적이며 투자 조언이 아닙니다. 수치는 계좌·거래 내역에 근거합니다.</p>"
    )
