"""lockstep 계약 정적 검증 — SUBAGENT_SPECS.mcp_tools ↔ MCP 라우터 operation_id.

계약: agents/domains/*.py 의 모든 mcp_tools 이름이 어느 *-mcp-service 라우터의
operation_id 와 정확히 일치해야 한다 (operation_id 가 FastMCP tool 이름의 SoT).
위반은 런타임에 crash 가 아니라 "기동 시 경고 후 제외"로 조용히 사라지므로
(app/agents/sub_agents.py) 정적 검사가 유일한 회귀 방어선이다.

검사 2가지:
  (1) 소비자 이름 ⊆ 공급자 operation_id 합집합 — 미존재 이름은 위반
  (2) operation_id 전역 유일성 — MultiServerMCPClient 가 tool 이름을 평탄화하므로
      서버 간 중복은 조용한 섀도잉

공급자 미사용 tool 은 위반 아님 (타 소비자·향후 바인딩용).
template-mcp-service 는 복사용 템플릿(미기동)이라 공급자에서 제외.

stdlib 전용 (AST 파싱, import 없음) — 의존성·env 없이 어디서든:
`python3 multi-agent-service/scripts/verify_mcp_lockstep.py` (cwd 무관).
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DOMAINS_DIR = REPO_ROOT / "multi-agent-service/app/agents/domains"
EXCLUDED_SERVICES = {"template-mcp-service"}


def collect_consumer() -> dict[str, list[str]]:
    """{sub_agent_name: [tool, ...]} — SUBAGENT_SPECS dict 의 키·mcp_tools 리터럴 추출."""
    out: dict[str, list[str]] = {}
    for path in sorted(DOMAINS_DIR.glob("*.py")):
        tree = ast.parse(path.read_text(), filename=str(path))
        for node in ast.walk(tree):
            if not isinstance(node, ast.Dict):
                continue
            for key, value in zip(node.keys, node.values, strict=True):
                if not (
                    isinstance(key, ast.Constant)
                    and isinstance(value, ast.Call)
                    and isinstance(value.func, ast.Name)
                    and value.func.id == "SubAgentSpec"
                ):
                    continue
                for kw in value.keywords:
                    if kw.arg == "mcp_tools" and isinstance(kw.value, ast.List):
                        out[key.value] = [ast.literal_eval(e) for e in kw.value.elts]
    return out


def collect_provider() -> tuple[dict[str, str], list[str]]:
    """({operation_id: 서비스}, [중복 메시지]) — 라우터 데코레이터의 operation_id 추출."""
    seen: dict[str, str] = {}
    duplicates: list[str] = []
    for routers_dir in sorted(REPO_ROOT.glob("*-mcp-service/app/routers")):
        service = routers_dir.parents[1].name
        if service in EXCLUDED_SERVICES:
            continue
        for path in sorted(routers_dir.rglob("*.py")):
            tree = ast.parse(path.read_text(), filename=str(path))
            for node in ast.walk(tree):
                if not isinstance(node, ast.Call):
                    continue
                for kw in node.keywords:
                    if kw.arg == "operation_id" and isinstance(kw.value, ast.Constant):
                        name = kw.value.value
                        if name in seen:
                            duplicates.append(f"{name}: {seen[name]} vs {service}")
                        seen[name] = service
    return seen, duplicates


def main() -> int:
    consumer = collect_consumer()
    provider, duplicates = collect_provider()

    if not consumer or not provider:
        print(f"수집 실패: sub-agent {len(consumer)}개 / operation_id {len(provider)}개 — 경로·파싱 확인")
        return 1

    missing = sorted({t for tools in consumer.values() for t in tools} - set(provider))

    ok = True
    if missing:
        ok = False
        print("mcp_tools 에 있으나 어느 MCP 라우터 operation_id 에도 없음 (기동 시 tool 제외됨):")
        for name in missing:
            users = ", ".join(s for s, tools in consumer.items() if name in tools)
            print(f"  - {name} (사용: {users})")
    if duplicates:
        ok = False
        print("operation_id 중복 (MultiServerMCPClient 에서 조용히 섀도잉됨):")
        for msg in duplicates:
            print(f"  - {msg}")

    if ok:
        n_tools = len({t for tools in consumer.values() for t in tools})
        print(
            f"lockstep OK — sub-agent {len(consumer)}개의 tool 이름 {n_tools}개 전부 operation_id {len(provider)}개에 존재, 중복 없음"
        )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
