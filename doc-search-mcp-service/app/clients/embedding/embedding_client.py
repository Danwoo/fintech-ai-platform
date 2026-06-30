"""OpenAI 호환 임베딩 API(bge-m3) 호출 — persistent AsyncClient + 일시 오류(502·503·504·네트워크) 재시도."""

import httpx
from utils.common.retry_utils import is_http_retryable, retry


class EmbeddingClient:
    def __init__(self, config, timeout: float = 30.0):
        self.base_url = config.OPENAI_EMBEDDING_URL.rstrip("/")
        self.model = config.OPENAI_EMBEDDING_MODEL_NAME
        self._api_key = config.OPENAI_EMBEDDING_API_KEY
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._client: httpx.AsyncClient | None = None

    def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={"Authorization": f"Bearer {self._api_key}", "Accept": "application/json"},
            )
        return self._client

    async def embed_query(self, text: str) -> list[float]:
        async def _do() -> httpx.Response:
            resp = await self._http().post(f"{self.base_url}/embeddings", json={"model": self.model, "input": [text]})
            if resp.status_code in (502, 503, 504):
                resp.raise_for_status()
            return resp

        resp = await retry(_do, base_delay=0.5, retryable=is_http_retryable)
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None
