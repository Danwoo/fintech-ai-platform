"""매 요청마다 fresh JWT 토큰을 주입하는 httpx Auth 어댑터.

MCP streamable-http 는 매 요청마다 별도 HTTP 요청을 보내므로, 세션 생성 시 고정으로 토큰을
담으면 1분 만료 후 401 발생한다. ``auth_flow`` 가 요청 직전 호출되는 성격을 이용해 토큰 갱신.
"""

import httpx
from core.security import create_access_token


class ServiceJwtAuth(httpx.Auth):
    """요청마다 fresh 서비스 JWT(exp 1분) 주입."""

    def auth_flow(self, request: httpx.Request):
        request.headers["Authorization"] = f"Bearer {create_access_token()}"
        yield request
