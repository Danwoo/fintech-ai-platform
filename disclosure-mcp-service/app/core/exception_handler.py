import re

from core.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    HTTPError,
    InternalServerError,
    NotFoundError,
    RequestTimeoutError,
    ServiceUnavailableError,
)
from core.logger import logger
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

# MSSQL pyodbc 자동 발생 제약 위반 → 도메인 예외 매핑
MSSQL_INTEGRITY_MAP: dict[int, HTTPError] = {
    2627: ConflictError("이미 등록된 값입니다."),
    2601: ConflictError("이미 등록된 값입니다."),
    547: ConflictError("참조 중인 데이터가 있어 처리할 수 없습니다."),
    515: BadRequestError("필수 입력 항목이 누락되었습니다."),
    8152: BadRequestError("입력 값이 허용된 길이를 초과했습니다."),
    245: BadRequestError("입력 값의 형식이 올바르지 않습니다."),
}


async def handle_http_error(request: Request, exc: HTTPError):
    """도메인 HTTPError → JSON 응답. 모든 HTTPError 서브클래스 자동 매칭."""
    status_code = exc.status_code
    message = str(exc)
    if 500 <= status_code < 600:
        logger.error(f"{request.method} {request.url.path} {status_code}: {exc}", exc_info=True)
    else:
        logger.warning(f"{request.method} {request.url.path} {status_code}: {exc}")
    return JSONResponse(status_code=status_code, content={"detail": message}, headers=exc.headers)


async def handle_http_exception(request: Request, exc: HTTPException):
    if 500 <= exc.status_code < 600:
        logger.error(f"{request.method} {request.url.path} {exc.status_code}: {exc.detail}", exc_info=True)
    elif 400 <= exc.status_code < 500:
        logger.warning(f"{request.method} {request.url.path} {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)


async def handle_integrity_error(request: Request, exc: IntegrityError):
    match = re.search(r"\((\d{2,5})\)", str(exc.orig or ""))
    code = int(match.group(1)) if match else None
    domain_exc = MSSQL_INTEGRITY_MAP.get(code) or ConflictError("데이터 제약 조건을 위반했습니다.")
    logger.warning(f"{request.method} {request.url.path} MSSQL {code}: {exc.orig}")
    return await handle_http_error(request, domain_exc)


async def handle_operational_error(request: Request, exc: OperationalError):
    logger.error(f"{request.method} {request.url.path} DB connection: {exc.orig}", exc_info=True)
    return await handle_http_error(request, ServiceUnavailableError("데이터베이스에 일시적으로 연결할 수 없습니다."))


async def handle_value_error(request: Request, exc: ValueError):
    return await handle_http_error(request, BadRequestError(str(exc) if re.search(r"[가-힣]", str(exc)) else None))


async def handle_permission_error(request: Request, exc: PermissionError):
    return await handle_http_error(request, ForbiddenError(str(exc) if re.search(r"[가-힣]", str(exc)) else None))


async def handle_file_not_found_error(request: Request, exc: FileNotFoundError):
    return await handle_http_error(request, NotFoundError(str(exc) if re.search(r"[가-힣]", str(exc)) else None))


async def handle_timeout_error(request: Request, exc: TimeoutError):
    return await handle_http_error(request, RequestTimeoutError(str(exc) if re.search(r"[가-힣]", str(exc)) else None))


async def handle_connection_error(request: Request, exc: ConnectionError):
    return await handle_http_error(
        request, ServiceUnavailableError(str(exc) if re.search(r"[가-힣]", str(exc)) else None)
    )


async def handle_runtime_error(request: Request, exc: RuntimeError):
    return await handle_http_error(request, InternalServerError(str(exc) if re.search(r"[가-힣]", str(exc)) else None))


async def handle_unexpected_exception(request: Request, exc: Exception):
    logger.error(f"{request.method} {request.url.path} unexpected: {repr(exc)}", exc_info=True)
    return await handle_http_error(request, InternalServerError())


def get_exception_handlers():
    return {
        HTTPError: handle_http_error,
        ValueError: handle_value_error,
        PermissionError: handle_permission_error,
        FileNotFoundError: handle_file_not_found_error,
        TimeoutError: handle_timeout_error,
        ConnectionError: handle_connection_error,
        RuntimeError: handle_runtime_error,
        IntegrityError: handle_integrity_error,
        OperationalError: handle_operational_error,
        HTTPException: handle_http_exception,
        Exception: handle_unexpected_exception,
    }
