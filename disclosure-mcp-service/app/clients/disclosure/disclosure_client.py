"""기업 전자공시·재무제표 연결 (transport) — DART OpenAPI(crtfc_key) 또는 내장 mock.

기본은 USE_REAL_API=false → API 키 없이 in-memory mock 공시/재무 데이터로 동작한다.
USE_REAL_API=true 이고 DISCLOSURE_API_KEY 가 있을 때만 실제 DART OpenAPI 를 호출한다 (없으면 mock 폴백).
mock 데이터는 잘 알려진 공개 발행사 몇 곳의 손익·재무상태·현금흐름·공시목록·배당·최대주주 샘플이다
(공개 시장 발행사 정보는 비밀이 아님). 응답 정규화(목록 추출·집계)는 repositories/disclosure 가 담당.

이 클래스는 SQL 엔진·HTTP 게이트웨이처럼 '연결'만 제공한다.
"""

import httpx
from clients.disclosure.mock_fixtures import (
    MOCK_COMPANIES,
    MOCK_DIVIDENDS,
    MOCK_FILINGS,
    MOCK_FINANCIALS,
    MOCK_SHAREHOLDERS,
    resolve_corp_code,
)
from utils.common.retry_utils import is_http_retryable, retry


class DisclosureClient:
    def __init__(self, config, timeout: float = 30.0):
        self.base_url = config.DISCLOSURE_API_BASE_URL.rstrip("/")
        self._api_key = config.DISCLOSURE_API_KEY
        self._use_real = bool(config.USE_REAL_API and config.DISCLOSURE_API_KEY)
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._client: httpx.AsyncClient | None = None

    @property
    def source(self) -> str:
        """현재 데이터 출처 — 'real'(DART OpenAPI) 또는 'mock'(내장 샘플)."""
        return "real" if self._use_real else "mock"

    def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def _get(self, endpoint: str, params: dict) -> dict:
        """GET {base}/{endpoint}.json — 일시 오류(502·503·504·네트워크) 재시도 후 JSON 파싱 (실API 경로)."""
        query = {k: v for k, v in params.items() if v is not None}
        query["crtfc_key"] = self._api_key

        async def _do() -> httpx.Response:
            resp = await self._http().get(f"{self.base_url}/{endpoint}.json", params=query)
            if resp.status_code in (502, 503, 504):
                resp.raise_for_status()
            return resp

        response = await retry(_do, base_delay=0.5, retryable=is_http_retryable)
        response.raise_for_status()
        return response.json()

    async def search_company(self, query: str | None = None) -> dict:
        if self._use_real:
            # 실 DART 는 corpCode.xml(전체 고유번호) 다운로드가 별도라, 운영에선 사내 매핑/캐시를 두는 게 정석.
            return {"list": []}
        q = (query or "").strip().lower()
        items = [
            c
            for c in MOCK_COMPANIES
            if not q or q in c["corp_name"].lower() or q == c["stock_code"] or q == c["corp_code"]
        ]
        return {"list": items}

    async def get_financials(self, corp: str, year: int, report_code: str, fs_type: str) -> dict:
        if self._use_real:
            corp_code = resolve_corp_code(corp)
            return await self._get(
                "fnlttSinglAcntAll",
                {
                    "corp_code": corp_code,
                    "bsns_year": str(year),
                    "reprt_code": report_code,
                    "fs_div": fs_type,
                },
            )
        corp_code = resolve_corp_code(corp)
        rows = MOCK_FINANCIALS.get((corp_code, year, fs_type), [])
        return {"list": rows}

    async def list_disclosures(
        self,
        corp: str | None,
        disclosure_type: str,
        start_date: str | None,
        end_date: str | None,
        page_no: int,
        page_count: int,
    ) -> dict:
        if self._use_real:
            corp_code = resolve_corp_code(corp) if corp else None
            return await self._get(
                "list",
                {
                    "corp_code": corp_code,
                    "pblntf_ty": None if disclosure_type == "ALL" else disclosure_type,
                    "bgn_de": start_date,
                    "end_de": end_date,
                    "page_no": page_no,
                    "page_count": min(page_count, 100),
                },
            )
        corp_code = resolve_corp_code(corp) if corp else None
        items = [
            f
            for f in MOCK_FILINGS
            if (corp_code is None or f["corp_code"] == corp_code)
            and (disclosure_type == "ALL" or f["pblntf_ty"] == disclosure_type)
            and (start_date is None or f["rcept_dt"] >= start_date)
            and (end_date is None or f["rcept_dt"] <= end_date)
        ]
        items.sort(key=lambda f: f["rcept_dt"], reverse=True)
        total = len(items)
        start = (page_no - 1) * page_count
        return {"list": items[start : start + page_count], "total_count": total}

    async def get_disclosure_detail(self, rcept_no: str) -> dict:
        if self._use_real:
            # 실 DART 는 document.xml(원문 zip) 별도 — 운영에선 목록 메타 + 본문 뷰어 링크로 대체.
            return {"list": []}
        item = next((f for f in MOCK_FILINGS if f["rcept_no"] == rcept_no), None)
        return {"item": item}

    async def get_dividend(self, corp: str, year: int) -> dict:
        if self._use_real:
            corp_code = resolve_corp_code(corp)
            return await self._get(
                "alotMatter",
                {"corp_code": corp_code, "bsns_year": str(year), "reprt_code": "11011"},
            )
        corp_code = resolve_corp_code(corp)
        rows = MOCK_DIVIDENDS.get((corp_code, year), [])
        return {"list": rows}

    async def get_major_shareholder(self, corp: str) -> dict:
        if self._use_real:
            corp_code = resolve_corp_code(corp)
            return await self._get(
                "hyslrSttus",
                {"corp_code": corp_code, "bsns_year": "2024", "reprt_code": "11011"},
            )
        corp_code = resolve_corp_code(corp)
        rows = MOCK_SHAREHOLDERS.get(corp_code, [])
        return {"list": rows}

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
