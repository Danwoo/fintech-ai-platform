"""테넌트 격리 회귀 검증 (#35) — 요청자 회사(company_id) 밖 계좌 데이터가 절대 새지 않음을 새 입력으로 공격.

계약:
  (1) list_accounts/list_holdings/search_* 는 요청자 테넌트 소유 계좌만 반환 — 타 회사 계좌·보유·거래·주문 불가시.
  (2) account_id 를 **직접** 타 테넌트 계좌로 지정해도 fail-closed — 빈 결과 / found=False (존재 오라클 차단).
  (3) 자기 소유 account_id 는 정상 조회.
  (4) 테넌트 미상(company_id=None: 요청 밖·순수 서비스 토큰) 이면 5개 조회 전부 UnauthorizedError — fail-closed.

mock 소유: 회사 1 = ACC-1001(KRW)·ACC-1002(USD), 회사 2 = ACC-1003(연금). 실제 PortfolioService 를 그대로 써
검사 — DB/LLM/외부 API 불필요. `uv run python scripts/verify_tenant_isolation.py` (cwd=서비스 루트).
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
from core.exceptions import UnauthorizedError  # noqa: E402

problems: list[str] = []


def check(name: str, cond: bool) -> None:
    if not cond:
        problems.append(name)


def as_tenant(company_id: int | None) -> None:
    set_auth_context(user_id="verify", role="admin", company_id=company_id)


async def run_checks() -> None:
    svc = Container().portfolio_service()

    # (1) 계좌 목록이 테넌트로 스코핑 — 회사 1 은 ACC-1001·1002 만, 회사 2 는 ACC-1003 만.
    as_tenant(1)
    ids_1 = {a["account_id"] for a in await svc.list_accounts()}
    check("회사1 계좌 = {ACC-1001, ACC-1002}", ids_1 == {"ACC-1001", "ACC-1002"})
    check("회사1 은 ACC-1003(타 테넌트)을 못 본다", "ACC-1003" not in ids_1)

    as_tenant(2)
    ids_2 = {a["account_id"] for a in await svc.list_accounts()}
    check("회사2 계좌 = {ACC-1003}", ids_2 == {"ACC-1003"})
    check("회사2 는 ACC-1001·1002(타 테넌트)를 못 본다", not (ids_2 & {"ACC-1001", "ACC-1002"}))

    # (1) 보유종목 합산도 내 계좌만 — 회사 2 결과에 회사 1 종목(삼성·AAPL)이 절대 없어야.
    as_tenant(2)
    h2 = await svc.list_holdings()
    accs_in_h2 = set(h2["accounts"])
    check("회사2 보유합산은 ACC-1003 만", accs_in_h2 <= {"ACC-1003"})
    tickers_2 = {r["ticker"] for r in h2["holdings"]}
    check("회사2 보유에 회사1 종목(005930·AAPL) 미유출", not (tickers_2 & {"005930", "AAPL", "MSFT", "000660"}))

    # (2) 타 테넌트 account_id 직접 지정 → fail-closed (빈 결과 / found=False). 존재를 노출하지 않는다.
    as_tenant(1)  # 회사 1 이 회사 2 계좌(ACC-1003)를 직접 노린다
    cross_h = await svc.list_holdings(account_id="ACC-1003")
    check("교차: 회사1→ACC-1003 보유 0건", cross_h["holding_count"] == 0 and cross_h["accounts"] == [])
    cross_t = await svc.search_transactions(account_id="ACC-1003", since="2026-01-01", until="2026-12-31")
    check("교차: 회사1→ACC-1003 거래 0건", cross_t["transaction_count"] == 0)
    cross_o = await svc.search_orders(account_id="ACC-1003", since="2026-01-01", until="2026-12-31")
    check("교차: 회사1→ACC-1003 주문 0건", cross_o["order_count"] == 0)
    cross_a = await svc.get_account_activity(account_id="ACC-1003", since="2026-01-01", until="2026-12-31")
    check("교차: 회사1→ACC-1003 활동 found=False (존재 오라클 차단)", cross_a["found"] is False)

    as_tenant(2)  # 반대 방향도 — 회사 2 가 회사 1 계좌(ACC-1001)를 직접 노린다
    rev_h = await svc.list_holdings(account_id="ACC-1001")
    check("교차: 회사2→ACC-1001 보유 0건", rev_h["holding_count"] == 0)
    rev_a = await svc.get_account_activity(account_id="ACC-1001", since="2026-01-01", until="2026-12-31")
    check("교차: 회사2→ACC-1001 활동 found=False", rev_a["found"] is False)

    # (3) 자기 소유 account_id 는 정상 — 격리가 자기 데이터까지 막지는 않음.
    as_tenant(1)
    own_h = await svc.list_holdings(account_id="ACC-1001")
    check("정상: 회사1→ACC-1001 보유 있음", own_h["holding_count"] > 0 and own_h["accounts"] == ["ACC-1001"])
    own_a = await svc.get_account_activity(account_id="ACC-1001", since="2026-01-01", until="2026-12-31")
    check("정상: 회사1→ACC-1001 활동 found=True", own_a["found"] is True)

    # (4) 테넌트 미상(company_id=None — 요청 밖·순수 서비스 토큰) → 5개 조회 전부 fail-closed(UnauthorizedError).
    as_tenant(None)

    async def raises_unauth(coro) -> bool:
        try:
            await coro
            return False
        except UnauthorizedError:
            return True

    check("fail-closed: list_accounts", await raises_unauth(svc.list_accounts()))
    check("fail-closed: list_holdings", await raises_unauth(svc.list_holdings()))
    check(
        "fail-closed: search_transactions",
        await raises_unauth(svc.search_transactions(since="2026-01-01", until="2026-12-31")),
    )
    check(
        "fail-closed: search_orders",
        await raises_unauth(svc.search_orders(since="2026-01-01", until="2026-12-31")),
    )
    check(
        "fail-closed: get_account_activity",
        await raises_unauth(svc.get_account_activity(account_id="ACC-1001")),
    )


def main() -> int:
    asyncio.run(run_checks())
    if problems:
        print("테넌트 격리 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("테넌트 격리 OK — 계좌·보유·거래·주문·활동이 요청자 회사로 스코핑, 교차 account_id fail-closed, 무테넌트 401")
    return 0


if __name__ == "__main__":
    sys.exit(main())
