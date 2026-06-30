"""포트폴리오 활동 요약 서비스 — 계좌 활동 수집 → LLM 요약 → 메일 발송."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from datetime import datetime, timedelta

from clients.mail.mail_client import MailClient
from clients.mcp.mcp_client import call_mcp_tool
from core.logger import logger
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from schemas.report.report_schema import ActivitySummaries
from utils.common.time_utils import now_kst
from utils.report.report_utils import collect, dedupe_common, render_html

_SYSTEM_PROMPT = (
    "투자 리서치 애널리스트로서 한 기간의 계좌·포트폴리오 활동 내역을 간결한 활동 요약으로 압축한다. "
    "중복·연속된 동일 종목 매매·유사 거래는 하나의 상위 활동 항목으로 적극 병합한다. "
    "개별 거래를 그대로 나열하지 말고, 큰 단위의 '무엇이 일어났는가'(신규 편입/비중 조정/배당·이자/리밸런싱) 중심으로 요약한다. "
    "포트폴리오당 3~6개 항목으로 간결하게(최대 7개). 성격이 다른 활동(매수/매도/배당/입출금/평가)만 구분한다. "
    "모든 수치는 제공된 활동 내역에만 근거하고 임의로 지어내지 않는다. 투자 조언·매매 권유 표현은 쓰지 않는다. "
    "포트폴리오명에 대괄호 등 입력 포맷 기호를 포함하지 않는다. "
    "입력 순서(오래된 것 → 최신) 유지. 한국어만 사용, 한자 금지."
)


class ActivityReportService:
    """기간 내 계좌 활동을 계좌별로 모아 LLM 으로 압축, 각 계좌주에게 메일 발송."""

    def __init__(
        self,
        mcp_client: MultiServerMCPClient,
        summarize_client: ChatOpenAI,
        mail_client: MailClient,
    ):
        self.mcp_client = mcp_client
        self._structured = summarize_client.with_structured_output(ActivitySummaries)
        self.mail_client = mail_client

    async def generate_for(self, members: list[dict], since: datetime, until: datetime) -> AsyncGenerator[str, None]:
        """멤버에게 [since, until] 요약 발송. 주별 조회·요약 후 멤버당 주차별 섹션을 한 통에 묶어 발송."""
        weeks = max(1, (until - since).days // 7)
        period = f"{since:%Y-%m-%d} ~ {until:%Y-%m-%d}"
        yield f"집계 기간: {period} ({weeks}주)"
        if not members:
            yield "발송 대상이 없습니다."
            return

        account_ids = [m["account_id"] for m in members]
        sections: dict[str, list[tuple[str, ActivitySummaries]]] = {m["email"]: [] for m in members}
        for w in range(weeks):
            ws = since + timedelta(weeks=w)
            label = f"{w + 1}주차 ({ws:%m-%d} ~ {(ws + timedelta(days=6)):%m-%d})"
            yield f"{label} 활동 조회 중..."
            try:
                result = await call_mcp_tool(
                    self.mcp_client,
                    "portfolio_get_account_activity",
                    {
                        "since": ws.isoformat(),
                        "until": (ws + timedelta(weeks=1)).isoformat(),
                        "account_ids": account_ids,
                    },
                )
            except Exception as e:
                logger.warning("[활동요약] %s 활동 조회 실패 — %s", label, e)
                yield f"{label} 조회 실패 — {e}"
                continue
            activities = result.get("activities", result.get("items", []))
            for member in members:
                by_portfolio = dedupe_common(collect(activities, member))
                if not by_portfolio:
                    continue
                try:
                    summaries = await self._summarize(by_portfolio)
                    sections[member["email"]].append((label, summaries))
                except Exception as e:
                    logger.warning("[활동요약] %s %s 요약 실패 — %s", member["email"], label, e)
                    yield f"{member['email']}: {label} 요약 실패 — {e}"

        for member in members:
            weekly = sections[member["email"]]
            if not weekly:
                yield f"{member['email']}: 해당 기간 활동 없음 — 생략"
                continue
            try:
                await self.mail_client.send_html(
                    member["email"],
                    f"[포트폴리오 활동 요약] {period}",
                    render_html(period, weekly),
                )
                yield f"{member['email']}: 섹션 {len(weekly)}개 발송 완료"
            except Exception as e:
                logger.warning("[활동요약] %s 발송 실패 — %s", member["email"], e)
                yield f"{member['email']}: 발송 실패 — {e}"

        yield "전체 완료"

    @staticmethod
    def period(weeks: int) -> tuple[datetime, datetime]:
        """직전 N주 (정확히 N주 전 같은 요일·시각 ~ 현재, KST)."""
        until = now_kst()
        return until - timedelta(weeks=weeks), until

    async def _summarize(self, by_portfolio: dict[str, list[str]]) -> ActivitySummaries:
        blocks = "\n\n".join(f"[{p}]\n" + "\n".join(f"- {s}" for s in subs) for p, subs in by_portfolio.items())
        messages = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=blocks),
        ]
        return await self._structured.ainvoke(messages)
