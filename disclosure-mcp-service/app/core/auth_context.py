"""인증 신원 컨텍스트 (ContextVar).

JWT 에서 확정한 요청자 신원(user_id/email/role/company_id)을 요청 단위로 보관한다.
verify_access_token 이 요청 진입 시 set 하고, service/permission 계층이 인자 드릴링 없이 읽는다.
- 각 요청은 자체 task(=자체 context copy)에서 실행되므로 요청 간 값 누수 없음.
- run_in_threadpool 은 context 를 복사하므로 sync DB 작업에서도 동일 값을 본다.
- 미설정(요청 밖 호출) 시 None → 권한 계층에서 fail-closed 처리.
"""

from contextvars import ContextVar

_user_id: ContextVar[str | None] = ContextVar("auth_user_id", default=None)
_email: ContextVar[str | None] = ContextVar("auth_email", default=None)
_role: ContextVar[str | None] = ContextVar("auth_role", default=None)
_company_id: ContextVar[int | None] = ContextVar("auth_company_id", default=None)


def set_auth_context(
    *,
    user_id: str | None,
    role: str | None,
    company_id: int | None,
    email: str | None = None,
) -> None:
    _user_id.set(user_id)
    _email.set(email)
    _role.set(role)
    _company_id.set(company_id)


def get_user_id() -> str | None:
    return _user_id.get()


def get_email() -> str | None:
    return _email.get()


def get_role() -> str | None:
    return _role.get()


def get_company_id() -> int | None:
    return _company_id.get()
