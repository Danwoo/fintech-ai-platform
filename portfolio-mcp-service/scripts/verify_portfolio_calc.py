"""포트폴리오 계산 회귀 검증 — 통화별 집계(환율 없이 통화 혼합 단순합 금지)와 정렬·비중 계약.

계약:
  (1) list_holdings/search_transactions/list_accounts 는 통화를 섞어 스칼라로 더하지 않는다.
      합계는 통화별 dict(total_market_value_by_currency / net_amount_by_currency / nav_by_currency)로 노출.
      제거된 스칼라 필드(total_market_value / net_amount)가 되살아나면 위반.
  (2) 통화별 합계는 그 통화 라인만의 합과 정확히 일치 (KRW 버킷에 USD 가 새지 않음).
  (3) 계좌 nav == nav_by_currency[base_currency]; 예수금은 기준통화 버킷에 포함.
  (4) 계좌 내 비중(weight) 합은 100 (단일통화 계좌). 빈 계좌는 0으로 나눠 터지지 않는다.
  (5) 정렬은 표시용 절단(YYYY-MM-DD)이 아니라 원본 타임스탬프로 — 같은 날짜의 시:분 순서를 보존.
      UTC offset 이 섞여도(로컬 +09:00 와 Z 혼재) 파싱된 aware 시각으로 비교해 실제 시간순이고,
      범위 필터도 파싱값으로 비교해 혼합 offset 행을 누락시키지 않는다.

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

    # (5) 정렬은 원본 타임스탬프 기준 — 같은 날짜 시:분 순서 보존
    broker = svc.portfolio_repo.broker
    broker.mock_transactions = lambda acc_id: (
        [
            {
                "trade_date": "2026-06-03T15:30:00+09:00",
                "tx_type": "sell",
                "ticker": "LATE",
                "name": "오후",
                "quantity": 1,
                "price": 1,
                "amount": 1,
                "currency": "KRW",
            },
            {
                "trade_date": "2026-06-03T09:15:00+09:00",
                "tx_type": "buy",
                "ticker": "EARLY",
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
    check("tx: 같은 날짜 오름차순은 원본 시각순(EARLY→LATE)", order == ["EARLY", "LATE"])

    # (5) 혼합 UTC offset — 09:00+09:00(=00:00Z) 이 01:00Z 보다 이르다 (lexicographic 정렬이면 역전)
    mixed_txs = [
        {
            "trade_date": "2026-06-03T01:00:00Z",
            "tx_type": "buy",
            "ticker": "UTC1",
            "name": "UTC1",
            "quantity": 1,
            "price": 1,
            "amount": 1,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-03T09:00:00+09:00",
            "tx_type": "buy",
            "ticker": "KST9",
            "name": "KST9",
            "quantity": 1,
            "price": 1,
            "amount": 1,
            "currency": "KRW",
        },
    ]
    broker.mock_transactions = lambda acc_id: ([dict(t) for t in mixed_txs] if acc_id == "ACC-1001" else [])
    st = await svc.search_transactions(account_id="ACC-1001", since="2026-06-01", until="2026-06-30")
    order = [r["ticker"] for r in st["transactions"]]
    check("tx: 혼합 offset 도 실제 시간순(KST9=00:00Z → UTC1=01:00Z)", order == ["KST9", "UTC1"])
    check("tx: 혼합 offset 필터 누락 없음(2건 유지)", st["transaction_count"] == 2)

    mixed_orders = [
        {
            "order_id": "O1",
            "ticker": "UTC1",
            "name": "UTC1",
            "side": "buy",
            "order_type": "limit",
            "status": "filled",
            "quantity": 1,
            "filled_quantity": 1,
            "price": 1,
            "avg_fill_price": 1,
            "placed_at": "2026-06-03T01:00:00Z",
            "currency": "KRW",
        },
        {
            "order_id": "O2",
            "ticker": "KST9",
            "name": "KST9",
            "side": "buy",
            "order_type": "limit",
            "status": "filled",
            "quantity": 1,
            "filled_quantity": 1,
            "price": 1,
            "avg_fill_price": 1,
            "placed_at": "2026-06-03T09:00:00+09:00",
            "currency": "KRW",
        },
    ]
    broker.mock_orders = lambda acc_id: ([dict(o) for o in mixed_orders] if acc_id == "ACC-1001" else [])
    so = await svc.search_orders(account_id="ACC-1001", since="2026-06-01", until="2026-06-30")
    order = [r["ticker"] for r in so["orders"]]
    check("orders: 혼합 offset 최신순(UTC1 → KST9)", order == ["UTC1", "KST9"])
    check("orders: 혼합 offset 필터 누락 없음(2건 유지)", so["order_count"] == 2)

    act = await svc.get_account_activity("ACC-1001", since="2026-06-01", until="2026-06-30")
    check(
        "activity: 혼합 offset 최신순 — 최상단이 01:00Z(UTC1) 이벤트",
        bool(act["events"]) and "UTC1" in act["events"][0]["detail"],
    )


def main() -> int:
    asyncio.run(run_checks())
    if problems:
        print("portfolio calc 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(
        "portfolio calc OK — 통화별 집계(혼합 스칼라합 금지)·nav 버킷 일치·비중 합 100·원본 타임스탬프 정렬·혼합 offset 시간순"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
