"""HTTP client for file-service (mirrors FileService interface).

환경에 따라 URL 분기:
- dev:        FILE_SERVICE_URL=http://localhost:8100
- staging:    FILE_SERVICE_URL=http://file-service:8000  (dedicated file-service)
- production: 동일 패턴

기존 FileService 와 동일한 메서드 시그니처/동기성을 유지하므로 caller 코드 변경 최소.
"""

from collections.abc import AsyncGenerator

import httpx
from core.security import create_access_token
from utils.common.retry_utils import is_http_retryable, retry


class FileServiceClient:
    """FileService 와 동일 인터페이스를 갖는 HTTP 클라이언트."""

    def __init__(self, config, timeout: float = 60.0, connect_timeout: float = 5.0):
        self.base_url = config.FILE_SERVICE_URL.rstrip("/")
        self.timeout = httpx.Timeout(timeout, connect=connect_timeout)
        self.sftp_base_path: str | None = getattr(config, "SFTP_BASE_PATH", None)

    def _headers(self) -> dict:
        token = create_access_token()
        return {"Authorization": f"Bearer {token}"}

    async def _get(self, url: str) -> httpx.Response:
        """GET 요청 with retry (TransportError / 502·503·504, 최대 3회, 지수 백오프)."""

        async def _do() -> httpx.Response:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=self._headers())
            if response.status_code in (502, 503, 504):
                response.raise_for_status()
            return response

        return await retry(_do, base_delay=0.5, retryable=is_http_retryable)

    # === Read (async) ===

    async def select_file(self, args: dict) -> dict | None:
        response = await self._get(f"{self.base_url}/file/{args['atch_file_id']}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    async def select_file_detail(self, args: dict) -> dict | None:
        response = await self._get(f"{self.base_url}/file/{args['atch_file_id']}/detail/{args['file_sn']}")
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()

    async def select_file_detail_list(self, args: dict) -> tuple[list, int]:
        response = await self._get(f"{self.base_url}/file/{args['atch_file_id']}/detail")
        response.raise_for_status()
        data = response.json()
        return data["items"], data["total_count"]

    async def get_last_file_sn(self, atch_file_id: str) -> int:
        items, _ = await self.select_file_detail_list({"atch_file_id": atch_file_id})
        if not items:
            return 0
        return max(item["file_sn"] for item in items)

    # === Write (async) ===

    async def upload_files(self, args: dict) -> dict:
        files_payload = []
        for f in args["files"]:
            f.file.seek(0)
            files_payload.append(
                ("files", (f.filename, f.file, getattr(f, "content_type", None) or "application/octet-stream"))
            )

        data = {}
        if args.get("atch_file_id"):
            data["atch_file_id"] = args["atch_file_id"]
        if self.sftp_base_path:
            data["base_path"] = self.sftp_base_path

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/file",
                files=files_payload,
                data=data,
                headers=self._headers(),
            )
            response.raise_for_status()
            payload = response.json()
            return payload.get("data", payload)

    # === Stream (async) ===

    async def stream_file_download(self, args: dict) -> AsyncGenerator[bytes, None]:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            async with client.stream(
                "GET",
                f"{self.base_url}/file/{args['atch_file_id']}/detail/{args['file_sn']}/download",
                headers=self._headers(),
            ) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    yield chunk

    async def read_file_content(self, args: dict) -> tuple[bytes, str]:
        detail = await self.select_file_detail(args)
        if not detail:
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {args}")
        chunks = []
        async for chunk in self.stream_file_download(args):
            chunks.append(chunk)
        return b"".join(chunks), detail["orignl_file_nm"]

    # === Delete (async) ===

    async def delete_file(self, args: dict) -> None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                f"{self.base_url}/file/{args['atch_file_id']}",
                headers=self._headers(),
            )
            response.raise_for_status()

    async def delete_file_detail(self, args: dict) -> None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.delete(
                f"{self.base_url}/file/{args['atch_file_id']}/detail/{args['file_sn']}",
                headers=self._headers(),
            )
            response.raise_for_status()
