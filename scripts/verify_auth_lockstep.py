"""인증 lockstep 정적 검증 — 전 서비스 security.py·auth_context.py 동일본 + config.py 강화 델타.

배경: 62194b9 인증 강화(fail-closed·Authorization 헤더 전용·서비스 토큰 typ·AUTH_DEV_BYPASS opt-in)는
backend-service 가 SoT 이고 전 backend 서비스가 이와 동일해야 한다. 서비스별 행동 검증 스크립트를
복사하는 대신 SoT 와의 정적 대조 1개로 표류를 막는다 (verify_mcp_lockstep.py·schema-parity 와 같은 철학).
행동 검증(무효 토큰 401, query param 미수용 등)은 multi-agent-service/scripts/verify_auth_hardening.py 가
담당 — 대상 파일이 byte-identical 이므로 한 서비스의 행동 검증이 전 서비스를 대표한다.

검사 2가지 (대상: app/core/security.py 를 가진 모든 *-service):
  (1) app/core/security.py·auth_context.py 가 backend-service 와 byte-identical
  (2) app/core/config.py 에 강화 델타 존재 (AST — 파싱 불가면 traceback 대신 위반으로 보고):
      - APP_ENV 기본값 "production" (미설정 배포가 fail-open dev 우회로 서는 사고 차단)
      - env_file=f".env.{os.getenv('APP_ENV', 'production')}" 의 fallback 리터럴도 "production"
        (기본값만 맞고 이 fallback 이 'development' 로 표류하면 APP_ENV 미설정 시 dev env 를 물어 fail-open)
      - AUTH_DEV_BYPASS: bool = False 필드 (dev 우회는 opt-in)
      - _forbid_dev_bypass_outside_dev validator (비-dev 에서 bypass=true 기동 거부)

stdlib 전용 (AST 파싱, import 없음) — 의존성·env 없이 어디서든:
`python3 scripts/verify_auth_lockstep.py` (cwd 무관).
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
REFERENCE_SERVICE = "backend-service"
AUTH_FILES = ["security.py", "auth_context.py"]
BYPASS_VALIDATOR = "_forbid_dev_bypass_outside_dev"
# 신규 *-service 는 glob 이 자동 흡수 — 이 목록은 security.py 삭제·이름변경 감지용 하한
EXPECTED_SERVICES = [
    "backend-service",
    "multi-agent-service",
    "portfolio-mcp-service",
    "market-data-mcp-service",
    "disclosure-mcp-service",
    "news-mcp-service",
    "web-mcp-service",
    "doc-search-mcp-service",
    "file-service",
    "devactivity-service",
    "single-agent-service",
    "template-mcp-service",
]


def discover_services() -> list[str]:
    return sorted(
        p.parents[2].name for p in REPO_ROOT.glob("*-service/app/core/security.py")
    )


def check_byte_identical(services: list[str]) -> list[str]:
    problems: list[str] = []
    for name in AUTH_FILES:
        reference = (REPO_ROOT / REFERENCE_SERVICE / "app" / "core" / name).read_bytes()
        for service in services:
            if service == REFERENCE_SERVICE:
                continue
            path = REPO_ROOT / service / "app" / "core" / name
            if not path.is_file():
                problems.append(f"{service}/app/core/{name}: 파일 없음")
            elif path.read_bytes() != reference:
                problems.append(
                    f"{service}/app/core/{name}: {REFERENCE_SERVICE} 와 내용 다름"
                )
    return problems


def _field_defaults(settings: ast.ClassDef) -> dict[str, ast.expr]:
    """Settings 본문의 `이름: 타입 = 기본값` 클래스 필드를 {이름: 기본값 expr} 로 수집."""
    out: dict[str, ast.expr] = {}
    for node in settings.body:
        if (
            isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.value is not None
        ):
            out[node.target.id] = node.value
    return out


def _env_file_fallback(settings: ast.ClassDef) -> ast.expr | None:
    """Settings 안 os.getenv("APP_ENV", <fallback>) 의 두 번째 인자 expr (없으면 None).

    env_file=f".env.{os.getenv('APP_ENV', 'production')}" 의 fallback 리터럴 — 이쪽만
    'development' 로 표류하면 APP_ENV 미설정 배포가 dev env 파일을 물어 fail-open 이 된다.
    """
    for node in ast.walk(settings):
        if not isinstance(node, ast.Call) or len(node.args) < 2:
            continue
        func = node.func
        is_getenv = (isinstance(func, ast.Attribute) and func.attr == "getenv") or (
            isinstance(func, ast.Name) and func.id == "getenv"
        )
        first = node.args[0]
        if is_getenv and isinstance(first, ast.Constant) and first.value == "APP_ENV":
            return node.args[1]
    return None


def check_config_delta(service: str) -> list[str]:
    path = REPO_ROOT / service / "app" / "core" / "config.py"
    prefix = f"{service}/app/core/config.py"
    if not path.is_file():
        return [f"{prefix}: 파일 없음"]
    try:
        tree = ast.parse(path.read_text(), filename=str(path))
    except SyntaxError as exc:
        return [f"{prefix}: 파싱 불가 (SyntaxError: {exc.msg}, line {exc.lineno})"]
    settings = next(
        (n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "Settings"),
        None,
    )
    if settings is None:
        return [f"{prefix}: Settings 클래스 없음"]

    problems: list[str] = []
    defaults = _field_defaults(settings)
    app_env = defaults.get("APP_ENV")
    if not (isinstance(app_env, ast.Constant) and app_env.value == "production"):
        problems.append(f'{prefix}: APP_ENV 기본값이 "production" 이 아님')
    fallback = _env_file_fallback(settings)
    if fallback is None:
        problems.append(
            f'{prefix}: env_file 의 os.getenv("APP_ENV", ...) fallback 없음'
        )
    elif not (isinstance(fallback, ast.Constant) and fallback.value == "production"):
        problems.append(
            f'{prefix}: env_file fallback 이 "production" 이 아님 (미설정 배포가 dev env 로 fail-open)'
        )
    bypass = defaults.get("AUTH_DEV_BYPASS")
    if not (isinstance(bypass, ast.Constant) and bypass.value is False):
        problems.append(f"{prefix}: AUTH_DEV_BYPASS: bool = False 필드 없음")
    if not any(
        isinstance(n, ast.FunctionDef) and n.name == BYPASS_VALIDATOR
        for n in settings.body
    ):
        problems.append(f"{prefix}: {BYPASS_VALIDATOR} validator 없음")
    return problems


def main() -> int:
    services = discover_services()
    problems = [
        f"{s}: app/core/security.py 미발견 (삭제·이름변경?)"
        for s in sorted(set(EXPECTED_SERVICES) - set(services))
    ]
    problems.extend(check_byte_identical(services))
    for service in services:
        problems.extend(check_config_delta(service))

    if problems:
        print("auth lockstep 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(
        f"auth lockstep OK — 서비스 {len(services)}개의 security.py·auth_context.py 가 {REFERENCE_SERVICE} 와 동일, "
        f'config.py 델타(APP_ENV "production" 기본·AUTH_DEV_BYPASS 필드·{BYPASS_VALIDATOR} validator) 전부 존재'
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
