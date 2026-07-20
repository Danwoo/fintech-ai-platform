"""시세 벤더 연결 (transport) — 기본은 MOCK 인메모리 픽스처라 API 키 없이 즉시 동작.

`USE_REAL_API=true` + `MARKET_API_KEY` 설정 시에만 실제 벤더(REST)를 호출한다 (선택·문서화).
시세/캔들/지수/환율/종목검색 응답을 dict 로 돌려주고, 파싱·정규화는 repositories/market 의 MarketRepository 담당.
이 클래스는 SQL 엔진·Milvus 연결처럼 '연결(또는 mock store)'만 제공한다.

⚠️ MOCK 픽스처는 공개 시장 정보(공개 발행사·샘플 티커)일 뿐 기업 비밀이 아니며, 실거래·실투자에 쓰지 말 것.
"""

import httpx
from utils.common.retry_utils import is_http_retryable, retry

# 공개 시장 샘플 티커 — 인메모리 MOCK (API 키 없이 동작). 실시세 아님, 데모·테스트용 고정 스냅샷.
_MOCK_QUOTES: dict[str, dict] = {
    "005930": {
        "symbol": "005930",
        "name": "삼성전자",
        "market": "KR",
        "currency": "KRW",
        "price": 78500,
        "prev_close": 77600,
        "change": 900,
        "change_pct": 1.16,
        "volume": 11842300,
        "market_cap": 468_000_000_000_000,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "000660": {
        "symbol": "000660",
        "name": "SK하이닉스",
        "market": "KR",
        "currency": "KRW",
        "price": 198000,
        "prev_close": 201500,
        "change": -3500,
        "change_pct": -1.74,
        "volume": 3120450,
        "market_cap": 144_000_000_000_000,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "035420": {
        "symbol": "035420",
        "name": "NAVER",
        "market": "KR",
        "currency": "KRW",
        "price": 215500,
        "prev_close": 213000,
        "change": 2500,
        "change_pct": 1.17,
        "volume": 845120,
        "market_cap": 35_400_000_000_000,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "AAPL": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "market": "US",
        "currency": "USD",
        "price": 232.15,
        "prev_close": 229.80,
        "change": 2.35,
        "change_pct": 1.02,
        "volume": 48210000,
        "market_cap": 3_550_000_000_000,
        "asof": "2026-06-29T16:00:00-04:00",
    },
    "MSFT": {
        "symbol": "MSFT",
        "name": "Microsoft Corporation",
        "market": "US",
        "currency": "USD",
        "price": 451.20,
        "prev_close": 448.10,
        "change": 3.10,
        "change_pct": 0.69,
        "volume": 19840000,
        "market_cap": 3_350_000_000_000,
        "asof": "2026-06-29T16:00:00-04:00",
    },
    "NVDA": {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "market": "US",
        "currency": "USD",
        "price": 128.45,
        "prev_close": 130.90,
        "change": -2.45,
        "change_pct": -1.87,
        "volume": 281430000,
        "market_cap": 3_150_000_000_000,
        "asof": "2026-06-29T16:00:00-04:00",
    },
}

# 지수 대표값 MOCK
_MOCK_INDEX: dict[str, dict] = {
    "KOSPI": {
        "index_code": "KOSPI",
        "name": "코스피",
        "market": "KR",
        "value": 2745.32,
        "change": 12.81,
        "change_pct": 0.47,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "KOSDAQ": {
        "index_code": "KOSDAQ",
        "name": "코스닥",
        "market": "KR",
        "value": 842.16,
        "change": -3.42,
        "change_pct": -0.40,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "SPX": {
        "index_code": "SPX",
        "name": "S&P 500",
        "market": "US",
        "value": 5460.48,
        "change": 18.32,
        "change_pct": 0.34,
        "asof": "2026-06-29T16:00:00-04:00",
    },
    "IXIC": {
        "index_code": "IXIC",
        "name": "NASDAQ Composite",
        "market": "US",
        "value": 17732.60,
        "change": -42.10,
        "change_pct": -0.24,
        "asof": "2026-06-29T16:00:00-04:00",
    },
}

# 환율 MOCK (1 base 단위당 quote 통화 가격)
_MOCK_FX: dict[str, dict] = {
    "USD/KRW": {
        "pair": "USD/KRW",
        "base": "USD",
        "quote": "KRW",
        "rate": 1382.40,
        "change": 4.20,
        "change_pct": 0.30,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "EUR/KRW": {
        "pair": "EUR/KRW",
        "base": "EUR",
        "quote": "KRW",
        "rate": 1481.05,
        "change": -2.10,
        "change_pct": -0.14,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "JPY/KRW": {
        "pair": "JPY/KRW",
        "base": "JPY",
        "quote": "KRW",
        "rate": 8.61,
        "change": 0.03,
        "change_pct": 0.35,
        "asof": "2026-06-30T15:30:00+09:00",
    },
    "USD/JPY": {
        "pair": "USD/JPY",
        "base": "USD",
        "quote": "JPY",
        "rate": 160.55,
        "change": 0.42,
        "change_pct": 0.26,
        "asof": "2026-06-30T15:30:00+09:00",
    },
}


def _mock_ohlc(symbol: str, interval: str, count: int) -> list[dict]:
    """시세 스냅샷을 기준으로 결정론적 합성 캔들 N개 생성 (최신순). 실데이터 아님 — 데모용."""
    base = _MOCK_QUOTES.get(symbol)
    if base is None:
        return []
    close = float(base["price"])
    rows: list[dict] = []
    for i in range(count):
        # i 가 클수록 과거. 결정론적 소폭 변동으로 합성.
        drift = 1.0 - (((i * 7) % 11) - 5) / 1000.0
        c = round(close * drift, 2)
        o = round(c * (1.0 + (((i * 3) % 7) - 3) / 1000.0), 2)
        hi = round(max(o, c) * 1.004, 2)
        lo = round(min(o, c) * 0.996, 2)
        vol = base["volume"] - (i * (base["volume"] // (count + 1)))
        rows.append(
            {
                "symbol": symbol,
                "interval": interval,
                "seq": i,
                "open": o,
                "high": hi,
                "low": lo,
                "close": c,
                "volume": max(vol, 0),
            }
        )
        close = c
    return rows


class MarketClient:
    def __init__(self, config, timeout: float = 30.0):
        self.base_url = config.MARKET_API_URL.rstrip("/")
        self._api_key = config.MARKET_API_KEY
        self._use_real_api = bool(config.USE_REAL_API)
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._client: httpx.AsyncClient | None = None

    def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def _get_json(self, path: str, query: dict) -> dict:
        """GET {base_url}/{path} — 일시 오류(502·503·504·네트워크) 재시도 후 JSON 파싱 (실 벤더 경로)."""

        async def _do() -> httpx.Response:
            params = {k: v for k, v in query.items() if v is not None}
            params["apiKey"] = self._api_key
            resp = await self._http().get(f"{self.base_url}/{path}", params=params)
            if resp.status_code in (502, 503, 504):
                resp.raise_for_status()
            return resp

        response = await retry(_do, base_delay=0.5, retryable=is_http_retryable)
        response.raise_for_status()
        return response.json()

    async def quote(self, symbol: str) -> dict:
        if self._use_real_api:
            return await self._get_json("quote", {"symbol": symbol})
        row = _MOCK_QUOTES.get(symbol.upper()) or _MOCK_QUOTES.get(symbol)
        return {"items": [row] if row else [], "total": 1 if row else 0}

    async def ohlc(self, symbol: str, interval: str, count: int) -> dict:
        if self._use_real_api:
            return await self._get_json("ohlc", {"symbol": symbol, "interval": interval, "count": count})
        sym = symbol.upper() if symbol.upper() in _MOCK_QUOTES else symbol
        rows = _mock_ohlc(sym, interval, count)
        return {"items": rows, "total": len(rows)}

    async def index(self, index_code: str) -> dict:
        if self._use_real_api:
            return await self._get_json("index", {"code": index_code})
        row = _MOCK_INDEX.get(index_code.upper())
        return {"items": [row] if row else [], "total": 1 if row else 0}

    async def fx(self, pair: str) -> dict:
        if self._use_real_api:
            return await self._get_json("fx", {"pair": pair})
        row = _MOCK_FX.get(pair.upper())
        return {"items": [row] if row else [], "total": 1 if row else 0}

    async def search(self, keyword: str, market: str, count: int) -> dict:
        if self._use_real_api:
            return await self._get_json("search", {"q": keyword, "market": market, "count": count})
        kw = keyword.lower()
        hits = [
            {"symbol": q["symbol"], "name": q["name"], "market": q["market"], "currency": q["currency"]}
            for q in _MOCK_QUOTES.values()
            if (market in ("ALL", q["market"])) and (kw in q["name"].lower() or kw in q["symbol"].lower())
        ]
        return {"items": hits[:count], "total": len(hits)}

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
