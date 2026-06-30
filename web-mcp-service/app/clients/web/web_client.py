"""Tavily Web Search API 연결 (transport) — api_key 본문 인증, JSON 응답. 단일 POST + 재시도, 연결 풀 재사용.

데이터 접근(score 필터·필드 트리밍)은 repositories/web 의 WebRepository 담당.
이 클래스는 SQL 엔진·Milvus 연결처럼 '연결'만 제공한다.
"""

import httpx
from utils.common.retry_utils import is_http_retryable, retry


class WebClient:
    def __init__(self, config, timeout: float = 30.0):
        self.base_url = "https://api.tavily.com"
        self._api_key = config.TAVILY_API_KEY
        self.exclude_domains = ["instagram.com", "facebook.com", "tiktok.com"]
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._client: httpx.AsyncClient | None = None

    def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "advanced",
        include_images: bool = True,
    ) -> dict:
        """POST {base}/search → JSON dict. 일시 오류(502·503·504·네트워크) 재시도."""

        async def _do() -> httpx.Response:
            resp = await self._http().post(
                f"{self.base_url}/search",
                json={
                    "api_key": self._api_key,
                    "query": query,
                    "search_depth": search_depth,
                    "include_images": include_images,
                    "max_results": min(max_results, 10),
                    "exclude_domains": self.exclude_domains,
                },
            )
            if resp.status_code in (502, 503, 504):
                resp.raise_for_status()
            return resp

        response = await retry(_do, base_delay=0.5, retryable=is_http_retryable)
        response.raise_for_status()
        return response.json()

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
