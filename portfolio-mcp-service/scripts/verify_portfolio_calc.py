"""포트폴리오 계산 회귀 검증 — 통화별 집계(환율 없이 통화 혼합 단순합 금지)와 정렬·비중 계약.

계약:
  (1) list_holdings/search_transactions/list_accounts 는 통화를 섞어 스칼라로 더하지 않는다.
      합계는 통화별 dict(total_market_value_by_currency / net_amount_by_currency / nav_by_currency)로 노출.
      제거된 스칼라 필드(total_market_value / net_amount)가 되살아나면 위반.
  (2) 통화별 합계는 그 통화 라인만의 합과 정확히 일치 (KRW 버킷에 USD 가 새지 않음).
  (3) 계좌 nav == nav_by_currency[base_currency]; 예수금은 기준통화 버킷에 포함.
  (4) 계좌 내 비중(weight) 합은 100 (단일통화 계좌). 빈 계좌는 0으로 나눠 터지지 않는다.
  (5) 정렬은 표시용 절단(YYYY-MM-DD)이 아니라 원본 타임스탬프로 — 같은 날짜의 시:분 순서를 보존.

실제 PortfolioService(mock 데이터)를 그대로 써 검사 — DB/LLM/외부 API 불필요.
`uv run python scripts/verify_portfolio_calc.py` (cwd=서비스 루트).
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "verify-secret")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from core.container import Container  # noqa: E402

problems: list[str] = []


def check(name: str, cond: bool) -> None:
    if not cond:
        problems.append(name)


async def run_checks() -> None:
    svc = Container().portfolio_service()

    # (1)+(2) list_holdings — 통화별 분리, 스칼라 부재, 버킷 정확성
    h = await svc.list_holdings()  # account_id=None → 전체 계좌(KRW+USD 혼재)
    check("holdings: 스칼라 total_market_value 제거됨", "total_market_value" not in h)
    check("holdings: total_market_value_by_currency 존재", "total_market_value_by_currency" in h)
    by_ccy = h.get("total_market_value_by_currency", {})
    check("holdings: 통화 2종(KRW·USD) 분리", set(by_ccy) >= {"KRW", "USD"})
    for ccy in by_ccy:
        expected = round(sum(r["market_value"] for r in h["holdings"] if r["currency"] == ccy), 2)
        check(f"holdings: {ccy} 버킷이 그 통화 합과 일치", abs(by_ccy[ccy] - expected) < 0.01)

    # (1)+(2) search_transactions — 통화별 부호합
    t = await svc.search_transactions(since="2026-01-01", until="2026-12-31")
    check("tx: 스칼라 net_amount 제거됨", "net_amount" not in t)
    net = t.get("net_amount_by_currency", {})
    check("tx: net_amount_by_currency 통화 분리", set(net) >= {"KRW", "USD"})
    for ccy in net:
        expected = round(sum(r["amount"] for r in t["transactions"] if r["currency"] == ccy), 2)
        check(f"tx: {ccy} 순합이 그 통화 합과 일치", abs(net[ccy] - expected) < 0.01)

    # (3)+(4) list_accounts nav / weight
    accts = await svc.list_accounts()
    for a in accts:
        check(
            f"acct {a['account_id']}: nav == nav_by_currency[base]",
            a["nav"] == a["nav_by_currency"][a["base_currency"]],
        )
    weight_sum: dict[str, float] = {}
    for r in h["holdings"]:
        weight_sum[r["account_id"]] = weight_sum.get(r["account_id"], 0.0) + r["weight"]
    for acc_id, s in weight_sum.items():
        check(f"acct {acc_id}: 비중 합 ≈ 100", abs(s - 100.0) < 0.1)

    # (4) 빈 계좌(0 평가자산) division-by-zero 안전 — 보유 0건이면 weight 계산 자체가 없어 통과, 명시 검사
    empty = await svc.list_holdings(account_id="ACC-NONEXISTENT")
    check("holdings: 미존재 계좌는 빈 결과(무예외)", empty["holding_count"] == 0)

    # (5) 정렬은 원본 타임스탬프 기준 — 같은 날짜 시:분 순서와 혼합 offset 시간순 보존
    broker = svc.portfolio_repo.broker
    broker.mock_transactions = lambda acc_id: (
        [
            {
                "trade_date": "2026-06-03T06:30:00Z",
                "tx_type": "sell",
                "ticker": "UTC-LATE",
                "name": "UTC 오후",
                "quantity": 1,
                "price": 1,
                "amount": 1,
                "currency": "KRW",
            },
            {
                "trade_date": "2026-06-03T09:15:00+09:00",
                "tx_type": "buy",
                "ticker": "KST-EARLY",
                "name": "오전",
                "quantity": 1,
                "price": 1,
                "amount": -1,
                "currency": "KRW",
            },
        ]
        if acc_id == "ACC-1001"
        else []
    )
    st = await svc.search_transactions(account_id="ACC-1001", since="2026-06-01", until="2026-06-30")
    order = [r["ticker"] for r in st["transactions"]]
    check("tx: 같은 날짜 오름차순은 offset 파싱 시각순(KST-EARLY→UTC-LATE)", order == ["KST-EARLY", "UTC-LATE"])

    broker.mock_transactions = lambda acc_id: (
        [
            {
                "trade_date": "2026-07-01T00:15:00Z",
                "tx_type": "buy",
                "ticker": "TOO-EARLY",
                "name": "범위 전",
                "quantity": 1,
                "price": 1,
                "amount": -1,
                "currency": "KRW",
            },
            {
                "trade_date": "2026-07-01T01:00:00Z",
                "tx_type": "buy",
                "ticker": "IN-RANGE",
                "name": "범위 안",
                "quantity": 1,
                "price": 1,
                "amount": -1,
                "currency": "KRW",
            },
            {
                "trade_date": "2026-07-01T11:00:00+09:00",
                "tx_type": "buy",
                "ticker": "TOO-LATE",
                "name": "범위 후",
                "quantity": 1,
                "price": 1,
                "amount": -1,
                "currency": "KRW",
            },
        ]
        if acc_id == "ACC-1001"
        else []
    )
    st = await svc.search_transactions(
        account_id="ACC-1001",
        since="2026-07-01T09:30:00+09:00",
        until="2026-07-01T10:30:00+09:00",
    )
    check("tx: mock 필터는 offset 파싱 시각 범위만 포함", [r["ticker"] for r in st["transactions"]] == ["IN-RANGE"])

    broker.mock_orders = lambda acc_id: (
        [
            {
                "order_id": "ORDER-EARLY",
                "ticker": "EARLY",
                "name": "이른 주문",
                "side": "buy",
                "order_type": "limit",
                "status": "open",
                "quantity": 1,
                "filled_quantity": 0,
                "price": 1,
                "avg_fill_price": 0,
                "placed_at": "2026-07-01T09:00:00+09:00",
                "currency": "KRW",
            },
            {
                "order_id": "ORDER-LATE",
                "ticker": "LATE",
                "name": "늦은 주문",
                "side": "buy",
                "order_type": "limit",
                "status": "open",
                "quantity": 1,
                "filled_quantity": 0,
                "price": 1,
                "avg_fill_price": 0,
                "placed_at": "2026-07-01T01:15:00Z",
                "currency": "KRW",
            },
        ]
        if acc_id == "ACC-1001"
        else []
    )
    so = await svc.search_orders(account_id="ACC-1001", since="2026-07-01", until="2026-07-01")
    check(
        "orders: 최신순은 offset 파싱 시각순(UTC LATE→KST EARLY)",
        [r["order_id"] for r in so["orders"]] == ["ORDER-LATE", "ORDER-EARLY"],
    )

    broker.mock_transactions = lambda acc_id: (
        [
            {
                "trade_date": "2026-07-01T01:00:00Z",
                "tx_type": "buy",
                "ticker": "IN-RANGE",
                "name": "범위 안",
                "quantity": 1,
                "price": 1,
                "amount": -1,
                "currency": "KRW",
            }
        ]
        if acc_id == "ACC-1001"
        else []
    )
    activity = await svc.get_account_activity(account_id="ACC-1001", since="2026-07-01", until="2026-07-01")
    check(
        "activity: 최신순은 거래·주문 혼합 offset 파싱 시각순",
        [r["action"] for r in activity["events"][:2]] == ["order", "trade"],
    )


def main() -> int:
    asyncio.run(run_checks())
    if problems:
        print("portfolio calc 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("portfolio calc OK — 통화별 집계(혼합 스칼라합 금지)·nav 버킷 일치·비중 합 100·원본 타임스탬프 정렬")
    return 0


if __name__ == "__main__":
    sys.exit(main())
