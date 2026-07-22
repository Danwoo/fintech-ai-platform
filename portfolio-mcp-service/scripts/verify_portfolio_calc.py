"""포트폴리오 계산 회귀 검증 — 통화별 집계·기준통화 환산(FX)·정밀도·정렬·비중 계약.

계약:
  (1) list_holdings/search_transactions/list_accounts 는 통화를 섞어 스칼라로 더하지 않는다.
      합계는 통화별 dict(total_market_value_by_currency / net_amount_by_currency / nav_by_currency)로 노출.
      제거된 스칼라 필드(total_market_value / net_amount)가 되살아나면 위반.
  (2) 통화별 합계는 그 통화 라인만의 합과 정확히 일치 (KRW 버킷에 USD 가 새지 않음).
  (3) 계좌 nav == nav_by_currency[base_currency]; 예수금은 기준통화 버킷에 포함.
  (4) 계좌 내 비중(weight) 합은 100 (단일통화 계좌). 빈 계좌는 0으로 나눠 터지지 않는다.
  (5) 정렬은 표시용 절단(YYYY-MM-DD)이 아니라 원본 타임스탬프로 — 같은 날짜의 시:분 순서를 보존.
  (6) FX 환산 정확성: *_in_base == Σ(통화별 합 × 환율), 환율 근거는 fx_rates_used 에 노출.
  (7) 환율 없는 통화는 지어내지 않고 unconverted 로 표기·in_base 에서 제외 (역수·삼각환산 안 함).
  (8) 정밀도: 통화 버킷은 라인별 반올림 합이 아니라 full precision 합 — 중간 반올림 드리프트가 없다.

실제 PortfolioService(mock 데이터)를 그대로 써 검사 — DB/LLM/외부 API 불필요.
환율은 외부 market-data-mcp 대신 StubFx 를 주입해 결정론적으로 검사한다.
`uv run python scripts/verify_portfolio_calc.py` (cwd=서비스 루트).
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "verify-secret")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from core.auth_context import set_auth_context  # noqa: E402
from core.container import Container  # noqa: E402

problems: list[str] = []


def check(name: str, cond: bool) -> None:
    if not cond:
        problems.append(name)


class StubFx:
    """market-data-mcp 대신 주입하는 결정론 환율 스텁. 주어진 통화쌍만 반환(나머지는 fail-soft 동일하게 생략)."""

    def __init__(self, rates: dict[str, dict] | None = None):
        self._rates = rates or {}

    async def fetch_rates(self, pairs: set[str]) -> dict[str, dict]:
        return {p: self._rates[p] for p in pairs if p in self._rates}


async def run_checks() -> None:
    svc = Container().portfolio_service()
    # 회사 1 은 ACC-1001(KRW)·ACC-1002(USD) 소유 — 통화 혼재 계약을 그대로 검사할 수 있는 테넌트.
    set_auth_context(user_id="verify", role="admin", company_id=1)
    svc.fx_client = StubFx()  # 기본: 환율 없음 — 네트워크 없이 hermetic (교차통화는 unconverted)

    # (1)+(2) list_holdings — 통화별 분리, 스칼라 부재, 버킷 정확성
    h = await svc.list_holdings()  # account_id=None → 내 계좌 전체(KRW+USD 혼재)
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

    # (6) FX 환산 정확성 — USD/KRW 환율 주입 시 in_base == KRW버킷 + USD버킷×환율, 근거는 fx_rates_used
    rate = 1300.0
    svc.fx_client = StubFx({"USD/KRW": {"rate": rate, "asof": "2026-06-30T15:30:00+09:00"}})
    hb = await svc.list_holdings(base_currency="KRW")  # 전체 계좌 KRW+USD 혼재
    bb = hb["total_market_value_by_currency"]
    expected_in_base = round(bb.get("KRW", 0.0) + bb.get("USD", 0.0) * rate, 2)
    check(
        "holdings: in_base == KRW버킷 + USD버킷×환율", abs(hb["total_market_value_in_base"] - expected_in_base) < 0.01
    )
    check("holdings: 환율 있으면 unconverted 비어있음", hb["unconverted_currencies"] == [])
    check("holdings: fx_rates_used 에 USD/KRW 근거 노출", hb["fx_rates_used"].get("USD/KRW", {}).get("rate") == rate)

    # tx 도 동일 — net_amount_in_base 환산 정확성
    tb = await svc.search_transactions(since="2026-01-01", until="2026-12-31", base_currency="KRW")
    nb = tb["net_amount_by_currency"]
    check(
        "tx: net_in_base == KRW + USD×환율",
        abs(tb["net_amount_in_base"] - round(nb.get("KRW", 0.0) + nb.get("USD", 0.0) * rate, 2)) < 0.01,
    )

    # (7) 환율 없는 통화는 지어내지 않고 unconverted — in_base 에서 제외
    svc.fx_client = StubFx()  # 환율 없음
    hu = await svc.list_holdings(base_currency="KRW")
    check("holdings: 환율 없는 USD 는 unconverted", "USD" in hu["unconverted_currencies"])
    check(
        "holdings: in_base 는 KRW 버킷만(USD 제외)",
        abs(hu["total_market_value_in_base"] - hu["total_market_value_by_currency"].get("KRW", 0.0)) < 0.01,
    )
    check("holdings: 환산 못한 통화쌍은 fx_rates_used 에 없음", "USD/KRW" not in hu["fx_rates_used"])

    # (7) 역수·삼각환산 안 함 — USD/KRW 가 있어도 base=USD(=KRW/USD 필요)는 KRW 를 환산하지 않고 unconverted
    svc.fx_client = StubFx({"USD/KRW": {"rate": rate, "asof": "2026-06-30T15:30:00+09:00"}})
    hr = await svc.list_holdings(base_currency="USD")
    check(
        "holdings: USD/KRW 있어도 base=USD 는 KRW/USD 필요 → 역수 안 하고 KRW unconverted",
        "KRW" in hr["unconverted_currencies"],
    )

    # (8) 정밀도 — 통화 버킷은 라인별 반올림 합(0.13+0.13=0.26)이 아니라 full precision 합(0.25)
    svc.fx_client = StubFx()
    broker = svc.portfolio_repo.broker
    broker.mock_holdings = lambda acc_id: (
        [
            {
                "ticker": "FRAC1",
                "name": "드리프트1",
                "asset_class": "equity",
                "quantity": 1,
                "avg_price": 0,
                "last_price": 0.125,
                "currency": "KRW",
            },
            {
                "ticker": "FRAC2",
                "name": "드리프트2",
                "asset_class": "equity",
                "quantity": 1,
                "avg_price": 0,
                "last_price": 0.125,
                "currency": "KRW",
            },
        ]
        if acc_id == "ACC-1001"
        else []
    )
    hd = await svc.list_holdings(account_id="ACC-1001")
    bucket = hd["total_market_value_by_currency"]["KRW"]
    naive = round(sum(r["market_value"] for r in hd["holdings"]), 2)  # 라인별 반올림 후 합 = 0.26
    check("holdings: 라인별 반올림 합은 0.26 (드리프트 발생 지점)", abs(naive - 0.26) < 1e-9)
    check("holdings: 버킷은 full precision 합 0.25 (드리프트 없음)", abs(bucket - 0.25) < 1e-9)
    check("holdings: 버킷 != 라인별 반올림 합 (중간 반올림 제거 증명)", bucket != naive)

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
    print(
        "portfolio calc OK — 통화별 집계·기준통화 환산(정확성/미환산 정직)·정밀도(드리프트 없음)·"
        "nav 버킷 일치·비중 합 100·원본 타임스탬프 정렬"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
