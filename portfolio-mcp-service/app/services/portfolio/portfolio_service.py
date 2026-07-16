# services/portfolio/portfolio_service.py
from repositories.portfolio.portfolio_repository import PortfolioRepository
from utils.common.time_utils import now_kst
from utils.portfolio.portfolio_utils import (
    event_line,
    holding_line,
    norm_since,
    norm_until,
    order_line,
    sum_by_currency,
    tx_line,
)
from utils.redaction.redactor import redact_secrets

_MAX_RESULTS = 250  # 검색 결과 상한 (초과 시 최신쪽 유지)


class PortfolioService:
    """브로커리지/포트폴리오 데이터 조회 (순수 포트폴리오 데이터, LLM 없음).

    숫자(평가금액·손익·비중)는 보유·체결 mock/공시 데이터에서 결정론적으로 계산하며 추정하지 않는다.
    """

    def __init__(self, portfolio_repository: PortfolioRepository):
        self.portfolio_repo = portfolio_repository

    async def list_accounts(self) -> list[dict]:
        """계좌 목록 (account_no 는 마스킹, NAV=현금+평가금액). 전역 카탈로그."""
        accounts = await self.portfolio_repo.list_accounts()
        account_ids = [a["account_id"] for a in accounts]
        holdings_by_acc = await self.portfolio_repo.list_holdings_many(account_ids)
        out = []
        for a in accounts:
            holdings = holdings_by_acc.get(a["account_id"], [])
            base_ccy = a.get("base_currency") or "KRW"
            cash = float(a.get("cash_balance") or 0)
            # 예수금은 기준통화, 보유분은 종목통화 — 환율 없이 통화를 섞어 더하지 않고 통화별로 NAV 를 낸다
            nav_by_ccy: dict[str, float] = {base_ccy: cash}
            for h in holdings:
                ccy = h.get("currency") or base_ccy
                nav_by_ccy[ccy] = nav_by_ccy.get(ccy, 0.0) + float(h.get("quantity") or 0) * float(
                    h.get("last_price") or 0
                )
            nav_by_ccy = {ccy: round(v, 2) for ccy, v in nav_by_ccy.items()}
            out.append(
                {
                    "account_id": a["account_id"],
                    "account_no": redact_secrets(a.get("account_no") or ""),
                    "account_name": a.get("account_name") or "",
                    "account_type": a.get("account_type") or "cash",
                    "base_currency": base_ccy,
                    "nav": nav_by_ccy[base_ccy],
                    "nav_by_currency": nav_by_ccy,
                    "cash_balance": round(cash, 2),
                }
            )
        return sorted(out, key=lambda x: x["account_id"])

    async def list_holdings(
        self,
        account_id: str | None = None,
        asset_class: str | None = None,
        ticker_keywords: list[str] | None = None,
        min_weight: float | None = None,
    ) -> dict:
        """보유종목 조회 → 평가금액·손익·비중 계산된 구조화 보유분. NL 추출·LLM 요약은 호출자 몫.

        account_id 지정 시 그 계좌만, 미지정 시 전체 계좌 합산. 비중(weight)은 계좌별 평가자산 기준.
        """
        accounts = await self.portfolio_repo.list_accounts()
        target_ids = [account_id] if account_id else [a["account_id"] for a in accounts]
        holdings_by_acc = await self.portfolio_repo.list_holdings_many(target_ids)

        rows: list[dict] = []
        for acc_id, holdings in holdings_by_acc.items():
            lines = [holding_line(acc_id, h) for h in holdings]
            acc_total = sum(line["market_value"] for line in lines)
            for line in lines:
                line["weight"] = round(line["market_value"] / acc_total * 100, 2) if acc_total else 0.0
            rows.extend(lines)

        kws = ticker_keywords or []
        rows = [
            r
            for r in rows
            if (not asset_class or r["asset_class"] == asset_class)
            and (not kws or any(k.lower() in r["ticker"].lower() or k.lower() in r["name"].lower() for k in kws))
            and (min_weight is None or r["weight"] >= min_weight)
        ]
        rows.sort(key=lambda r: r["market_value"], reverse=True)
        return {
            "holdings": rows,
            "holding_count": len(rows),
            "total_market_value_by_currency": sum_by_currency(rows, "market_value"),
            "accounts": sorted({r["account_id"] for r in rows}),
        }

    async def search_transactions(
        self,
        account_id: str | None = None,
        tx_type: str | None = None,
        ticker_keywords: list[str] | None = None,
        since: str | None = None,
        until: str | None = None,
    ) -> dict:
        """구조화 조건으로 거래 검색 → 필터·시간순 정렬된 구조화 거래. account_id 미지정 시 전체 계좌."""
        now = now_kst()
        since = norm_since(since, now)
        until = norm_until(until, now)
        accounts = await self.portfolio_repo.list_accounts()
        target_ids = [account_id] if account_id else [a["account_id"] for a in accounts]
        tx_by_acc = await self.portfolio_repo.list_transactions_many(target_ids, since, until)

        kws = ticker_keywords or []
        # 표시 trade_date 는 날짜로 절단되지만 정렬은 원본 타임스탬프(있으면 시:분:초까지)로 해 당일 내 순서를 보존한다
        keyed: list[tuple[str, dict]] = []
        for acc_id, txs in tx_by_acc.items():
            for t in txs:
                line = tx_line(acc_id, t)
                if tx_type and line["tx_type"] != tx_type:
                    continue
                if kws and not any(
                    k.lower() in line["ticker"].lower() or k.lower() in line["name"].lower() for k in kws
                ):
                    continue
                keyed.append((t.get("trade_date") or "", line))
        keyed.sort(key=lambda pair: pair[0])  # 시간순(오래된→최신)
        truncated = len(keyed) > _MAX_RESULTS
        rows = [line for _, line in (keyed[-_MAX_RESULTS:] if truncated else keyed)]
        return {
            "transactions": rows,
            "transaction_count": len(rows),
            "truncated": truncated,
            "period": f"{since[:10]} ~ {until[:10]}",
            "net_amount_by_currency": sum_by_currency(rows, "amount"),
            "accounts": sorted({r["account_id"] for r in rows}),
        }

    async def search_orders(
        self,
        account_id: str | None = None,
        status: str | None = None,
        side: str | None = None,
        ticker_keywords: list[str] | None = None,
        since: str | None = None,
        until: str | None = None,
    ) -> dict:
        """구조화 조건으로 주문 검색 → 최신 접수순 구조화 주문. account_id 미지정 시 전체 계좌."""
        now = now_kst()
        since = norm_since(since, now)
        until = norm_until(until, now)
        accounts = await self.portfolio_repo.list_accounts()
        target_ids = [account_id] if account_id else [a["account_id"] for a in accounts]
        orders_by_acc = await self.portfolio_repo.list_orders_many(target_ids, since, until)

        kws = ticker_keywords or []
        # 표시 placed_at 은 날짜로 절단되지만 정렬은 원본 타임스탬프로 해 당일 내 순서를 보존한다
        keyed: list[tuple[str, dict]] = []
        for acc_id, orders in orders_by_acc.items():
            for o in orders:
                line = order_line(acc_id, o)
                if status and line["status"] != status:
                    continue
                if side and line["side"] != side:
                    continue
                if kws and not any(
                    k.lower() in line["ticker"].lower() or k.lower() in line["name"].lower() for k in kws
                ):
                    continue
                keyed.append((o.get("placed_at") or "", line))
        keyed.sort(key=lambda pair: pair[0], reverse=True)  # 최신 접수순
        truncated = len(keyed) > _MAX_RESULTS
        rows = [line for _, line in keyed[:_MAX_RESULTS]]
        return {
            "orders": rows,
            "order_count": len(rows),
            "truncated": truncated,
            "period": f"{since[:10]} ~ {until[:10]}",
            "accounts": sorted({r["account_id"] for r in rows}),
        }

    async def get_account_activity(self, account_id: str, since: str | None = None, until: str | None = None) -> dict:
        """계좌(account_id)의 활동 이벤트(체결·주문·입출금·배당 통합, 최신순).

        account_id 미존재 시 예외 대신 found=False 로 graceful 반환 — 에이전트 스트림이 깨지지 않고
        '활동 없음(0건)' 과 '계좌 미존재' 를 구분해 답할 수 있게 한다.
        """
        now = now_kst()
        since = norm_since(since, now)
        until = norm_until(until, now)
        account = await self.portfolio_repo.find_account(account_id)
        if not account:
            return {
                "account_id": account_id,
                "events": [],
                "count": 0,
                "found": False,
                "period": f"{since[:10]} ~ {until[:10]}",
            }

        txs = await self.portfolio_repo.list_transactions(account_id, since, until)
        orders = await self.portfolio_repo.list_orders(account_id, since, until)
        raw: list[dict] = []
        for t in txs:
            line = tx_line(account_id, t)
            cash_types = {"deposit", "withdraw", "fee"}
            action = (
                "dividend" if line["tx_type"] == "dividend" else ("cash" if line["tx_type"] in cash_types else "trade")
            )
            label = line["name"] or line["tx_type"]
            qty = f" {line['quantity']:g}주" if line["quantity"] else ""
            raw.append(
                {
                    "date": t.get("trade_date") or "",  # 원본 타임스탬프로 정렬, event_line 이 표시용으로 절단
                    "action": action,
                    "detail": f"{line['tx_type']} {label}{qty} ({line['amount']:+,.0f} {line['currency']})",
                    "amount": line["amount"],
                }
            )
        for o in orders:
            line = order_line(account_id, o)
            raw.append(
                {
                    "date": o.get("placed_at") or "",
                    "action": "order",
                    "detail": f"{line['side']} {line['name']} {line['status']} ({line['filled_quantity']:g}/{line['quantity']:g})",
                    "amount": 0.0,
                }
            )

        raw.sort(key=lambda e: e["date"], reverse=True)  # 최신순
        lines = [event_line(e) for e in raw]
        truncated = len(lines) > _MAX_RESULTS
        rows = lines[:_MAX_RESULTS]
        return {
            "account_id": account_id,
            "events": rows,
            "count": len(rows),
            "truncated": truncated,
            "found": True,
            "period": f"{since[:10]} ~ {until[:10]}",
        }
