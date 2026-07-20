"""브로커리지/포트폴리오 데이터 연결 (transport) — 기본은 in-memory MOCK, USE_REAL_API=true 면 실 브로커리지 REST API.

데이터 접근(계좌·보유·거래·주문·활동 조회, 필터)은 repositories/portfolio 의 PortfolioRepository 담당.
이 클래스는 SQL 엔진·HTTP 연결처럼 '데이터 소스'만 제공한다.

MOCK 모드(기본): API 키 없이 즉시 동작하도록 공개 종목(삼성전자·Apple 등 잘 알려진 상장사) 기반의
샘플 포트폴리오를 메모리에 들고 있다 — 공개 시장 엔티티이므로 실제 비밀 정보가 아니다.
REAL 모드: config.BROKERAGE_API_BASE_URL/TOKEN 으로 외부 REST API 를 async httpx 로 호출 (재시도 포함).
"""

import httpx
from utils.common.retry_utils import is_http_retryable, retry

# --- MOCK FIXTURES (공개 상장사 기반 샘플 포트폴리오 — API 키 없이 standalone 동작) ---
# 계좌번호(account_no)는 노출 전 service 가 redact 로 가운데를 마스킹한다.
_MOCK_ACCOUNTS: list[dict] = [
    {
        "account_id": "ACC-1001",
        "account_no": "5012-01-2345678",
        "account_name": "종합매매계좌",
        "account_type": "cash",
        "base_currency": "KRW",
        "cash_balance": 8_500_000.0,
    },
    {
        "account_id": "ACC-1002",
        "account_no": "5012-02-7654321",
        "account_name": "글로벌주식계좌",
        "account_type": "cash",
        "base_currency": "USD",
        "cash_balance": 3_200.0,
    },
    {
        "account_id": "ACC-1003",
        "account_no": "5099-07-1112223",
        "account_name": "연금저축계좌",
        "account_type": "pension",
        "base_currency": "KRW",
        "cash_balance": 1_250_000.0,
    },
]

_MOCK_HOLDINGS: dict[str, list[dict]] = {
    "ACC-1001": [
        {
            "ticker": "005930",
            "name": "삼성전자",
            "asset_class": "equity",
            "quantity": 120,
            "avg_price": 68_000,
            "last_price": 74_500,
            "currency": "KRW",
        },
        {
            "ticker": "000660",
            "name": "SK하이닉스",
            "asset_class": "equity",
            "quantity": 40,
            "avg_price": 158_000,
            "last_price": 192_000,
            "currency": "KRW",
        },
        {
            "ticker": "035420",
            "name": "NAVER",
            "asset_class": "equity",
            "quantity": 25,
            "avg_price": 205_000,
            "last_price": 187_500,
            "currency": "KRW",
        },
        {
            "ticker": "069500",
            "name": "KODEX 200",
            "asset_class": "etf",
            "quantity": 300,
            "avg_price": 34_200,
            "last_price": 36_100,
            "currency": "KRW",
        },
    ],
    "ACC-1002": [
        {
            "ticker": "AAPL",
            "name": "Apple Inc.",
            "asset_class": "equity",
            "quantity": 30,
            "avg_price": 178.4,
            "last_price": 212.5,
            "currency": "USD",
        },
        {
            "ticker": "MSFT",
            "name": "Microsoft Corp.",
            "asset_class": "equity",
            "quantity": 12,
            "avg_price": 372.1,
            "last_price": 445.8,
            "currency": "USD",
        },
        {
            "ticker": "VOO",
            "name": "Vanguard S&P 500 ETF",
            "asset_class": "etf",
            "quantity": 15,
            "avg_price": 405.0,
            "last_price": 498.2,
            "currency": "USD",
        },
    ],
    "ACC-1003": [
        {
            "ticker": "360750",
            "name": "TIGER 미국S&P500",
            "asset_class": "etf",
            "quantity": 500,
            "avg_price": 12_100,
            "last_price": 16_450,
            "currency": "KRW",
        },
        {
            "ticker": "KR-TB-03Y",
            "name": "국고채 3년",
            "asset_class": "bond",
            "quantity": 50,
            "avg_price": 9_980,
            "last_price": 10_120,
            "currency": "KRW",
        },
    ],
}

_MOCK_TRANSACTIONS: dict[str, list[dict]] = {
    "ACC-1001": [
        {
            "trade_date": "2026-06-02",
            "tx_type": "buy",
            "ticker": "005930",
            "name": "삼성전자",
            "quantity": 20,
            "price": 71_200,
            "amount": -1_424_000,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-09",
            "tx_type": "dividend",
            "ticker": "005930",
            "name": "삼성전자",
            "quantity": 0,
            "price": 0,
            "amount": 43_200,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-15",
            "tx_type": "sell",
            "ticker": "035420",
            "name": "NAVER",
            "quantity": 5,
            "price": 189_000,
            "amount": 945_000,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-18",
            "tx_type": "buy",
            "ticker": "069500",
            "name": "KODEX 200",
            "quantity": 100,
            "price": 35_900,
            "amount": -3_590_000,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-20",
            "tx_type": "fee",
            "ticker": "",
            "name": "",
            "quantity": 0,
            "price": 0,
            "amount": -5_280,
            "currency": "KRW",
        },
    ],
    "ACC-1002": [
        {
            "trade_date": "2026-06-05",
            "tx_type": "deposit",
            "ticker": "",
            "name": "",
            "quantity": 0,
            "price": 0,
            "amount": 5_000,
            "currency": "USD",
        },
        {
            "trade_date": "2026-06-06",
            "tx_type": "buy",
            "ticker": "AAPL",
            "name": "Apple Inc.",
            "quantity": 10,
            "price": 205.3,
            "amount": -2_053.0,
            "currency": "USD",
        },
        {
            "trade_date": "2026-06-19",
            "tx_type": "buy",
            "ticker": "VOO",
            "name": "Vanguard S&P 500 ETF",
            "quantity": 5,
            "price": 492.0,
            "amount": -2_460.0,
            "currency": "USD",
        },
    ],
    "ACC-1003": [
        {
            "trade_date": "2026-06-10",
            "tx_type": "deposit",
            "ticker": "",
            "name": "",
            "quantity": 0,
            "price": 0,
            "amount": 1_000_000,
            "currency": "KRW",
        },
        {
            "trade_date": "2026-06-11",
            "tx_type": "buy",
            "ticker": "360750",
            "name": "TIGER 미국S&P500",
            "quantity": 80,
            "price": 16_200,
            "amount": -1_296_000,
            "currency": "KRW",
        },
    ],
}

_MOCK_ORDERS: dict[str, list[dict]] = {
    "ACC-1001": [
        {
            "order_id": "ORD-9001",
            "ticker": "005930",
            "name": "삼성전자",
            "side": "buy",
            "order_type": "limit",
            "status": "filled",
            "quantity": 20,
            "filled_quantity": 20,
            "price": 71_200,
            "avg_fill_price": 71_200,
            "placed_at": "2026-06-02",
            "currency": "KRW",
        },
        {
            "order_id": "ORD-9014",
            "ticker": "035420",
            "name": "NAVER",
            "side": "sell",
            "order_type": "limit",
            "status": "filled",
            "quantity": 5,
            "filled_quantity": 5,
            "price": 189_000,
            "avg_fill_price": 189_000,
            "placed_at": "2026-06-15",
            "currency": "KRW",
        },
        {
            "order_id": "ORD-9020",
            "ticker": "000660",
            "name": "SK하이닉스",
            "side": "buy",
            "order_type": "limit",
            "status": "open",
            "quantity": 10,
            "filled_quantity": 0,
            "price": 185_000,
            "avg_fill_price": 0,
            "placed_at": "2026-06-22",
            "currency": "KRW",
        },
        {
            "order_id": "ORD-9023",
            "ticker": "069500",
            "name": "KODEX 200",
            "side": "buy",
            "order_type": "market",
            "status": "filled",
            "quantity": 100,
            "filled_quantity": 100,
            "price": 0,
            "avg_fill_price": 35_900,
            "placed_at": "2026-06-18",
            "currency": "KRW",
        },
    ],
    "ACC-1002": [
        {
            "order_id": "ORD-9105",
            "ticker": "AAPL",
            "name": "Apple Inc.",
            "side": "buy",
            "order_type": "limit",
            "status": "filled",
            "quantity": 10,
            "filled_quantity": 10,
            "price": 205.3,
            "avg_fill_price": 205.3,
            "placed_at": "2026-06-06",
            "currency": "USD",
        },
        {
            "order_id": "ORD-9112",
            "ticker": "MSFT",
            "name": "Microsoft Corp.",
            "side": "buy",
            "order_type": "limit",
            "status": "partial",
            "quantity": 8,
            "filled_quantity": 3,
            "price": 440.0,
            "avg_fill_price": 439.5,
            "placed_at": "2026-06-21",
            "currency": "USD",
        },
        {
            "order_id": "ORD-9118",
            "ticker": "VOO",
            "name": "Vanguard S&P 500 ETF",
            "side": "buy",
            "order_type": "limit",
            "status": "canceled",
            "quantity": 5,
            "filled_quantity": 0,
            "price": 480.0,
            "avg_fill_price": 0,
            "placed_at": "2026-06-17",
            "currency": "USD",
        },
    ],
    "ACC-1003": [
        {
            "order_id": "ORD-9201",
            "ticker": "360750",
            "name": "TIGER 미국S&P500",
            "side": "buy",
            "order_type": "limit",
            "status": "filled",
            "quantity": 80,
            "filled_quantity": 80,
            "price": 16_200,
            "avg_fill_price": 16_200,
            "placed_at": "2026-06-11",
            "currency": "KRW",
        },
    ],
}


class PortfolioClient:
    def __init__(self, config, timeout: float = 30.0):
        self._use_real = bool(getattr(config, "USE_REAL_API", False))
        self.base_url = (getattr(config, "BROKERAGE_API_BASE_URL", "") or "").rstrip("/")
        self._token = getattr(config, "BROKERAGE_API_TOKEN", "") or ""
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._client: httpx.AsyncClient | None = None

    @property
    def use_real(self) -> bool:
        return self._use_real

    def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={"Authorization": f"Bearer {self._token}", "Accept": "application/json"},
                follow_redirects=True,
            )
        return self._client

    async def get(self, path: str, params: dict | None = None) -> httpx.Response:
        """GET {base}{path} — 일시 오류(502·503·504·네트워크) 재시도. REAL 모드 전용."""

        async def _do() -> httpx.Response:
            resp = await self._http().get(f"{self.base_url}{path}", params=params or {})
            if resp.status_code in (502, 503, 504):
                resp.raise_for_status()
            return resp

        return await retry(_do, base_delay=0.5, retryable=is_http_retryable)

    # --- MOCK 접근자 (REAL 모드면 repository 가 get() 으로 우회) ---
    def mock_accounts(self) -> list[dict]:
        return [dict(a) for a in _MOCK_ACCOUNTS]

    def mock_holdings(self, account_id: str) -> list[dict]:
        return [dict(h) for h in _MOCK_HOLDINGS.get(account_id, [])]

    def mock_transactions(self, account_id: str) -> list[dict]:
        return [dict(t) for t in _MOCK_TRANSACTIONS.get(account_id, [])]

    def mock_orders(self, account_id: str) -> list[dict]:
        return [dict(o) for o in _MOCK_ORDERS.get(account_id, [])]

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
