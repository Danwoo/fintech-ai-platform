#!/usr/bin/env python3
"""plan_execute.py 리팩터링 동작 보존 정적 증명 스크립트.

원본(origin/main)과 신규 패키지의 최상위 정의 본문 AST 를 정규화해 비교한다.
LLM/MCP 없이 순수 코드 구조 동등성을 검증한다.
"""

from __future__ import annotations

import ast
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ORIGIN_FILE = "multi-agent-service/app/graphs/plan_execute.py"
NEW_PACKAGE = "multi-agent-service/app/graphs/plan_execute"


def get_original_source() -> str:
    return subprocess.check_output(
        ["git", "show", f"origin/main:{ORIGIN_FILE}"],
        cwd=REPO_ROOT,
        text=True,
    )


def clear_locations(node: ast.AST) -> None:
    for attr in ("lineno", "col_offset", "end_lineno", "end_col_offset"):
        if hasattr(node, attr):
            setattr(node, attr, None)
    for child in ast.iter_child_nodes(node):
        clear_locations(child)


def normalize_node(node: ast.AST) -> str:
    clear_locations(node)
    return ast.dump(node, include_attributes=False)


def collect_definitions(tree: ast.Module) -> dict[str, ast.AST]:
    defs: dict[str, ast.AST] = {}
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defs[node.name] = node
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    defs[target.id] = node
    return defs


def main() -> int:
    original_source = get_original_source()
    original_tree = ast.parse(original_source, filename=ORIGIN_FILE)
    original_defs = collect_definitions(original_tree)

    new_defs: dict[str, ast.AST] = {}
    new_package_path = REPO_ROOT / NEW_PACKAGE
    for py_file in sorted(new_package_path.glob("*.py")):
        tree = ast.parse(py_file.read_text(encoding="utf-8"), filename=str(py_file))
        new_defs.update(collect_definitions(tree))

    missing = []
    mismatched = []
    for name, orig_node in original_defs.items():
        if name not in new_defs:
            missing.append(name)
            continue
        new_node = new_defs[name]
        if normalize_node(orig_node) != normalize_node(new_node):
            mismatched.append(name)

    extra = sorted(set(new_defs) - set(original_defs))

    print("=" * 60)
    print("plan_execute.py refactoring static equivalence check")
    print("=" * 60)
    print(f"Original definitions : {len(original_defs)}")
    print(f"New definitions      : {len(new_defs)}")
    print(f"Missing              : {missing}")
    print(f"Mismatched AST body  : {mismatched}")
    print(f"Extra in new package : {extra}")
    print("-" * 60)

    if missing or mismatched:
        print("RESULT: FAIL")
        return 1

    print("AST equivalence: OK")

    # Public import contract — run inside the service uv environment.
    try:
        import_result = subprocess.run(
            [
                "uv",
                "run",
                "--directory",
                str(REPO_ROOT / "multi-agent-service"),
                "python",
                "-c",
                "from graphs.plan_execute import COMPLIANCE_DISCLAIMER, build_plan_execute_graph; "
                "print('import_ok:', COMPLIANCE_DISCLAIMER[:10])",
            ],
            cwd=REPO_ROOT / "multi-agent-service",
            capture_output=True,
            text=True,
            check=False,
            env={**subprocess.os.environ, "PYTHONPATH": str(REPO_ROOT / "multi-agent-service" / "app")},
        )
        if import_result.returncode != 0:
            print("Public import contract: FAIL")
            print(import_result.stderr)
            return 1
        print("Public import contract: OK")
    except Exception as exc:
        print(f"Public import contract check error: {exc}")
        return 1

    # Circular import / syntax sanity
    try:
        subprocess.run(
            [
                "uv",
                "run",
                "--directory",
                str(REPO_ROOT / "multi-agent-service"),
                "python",
                "-c",
                "import graphs.plan_execute",
            ],
            cwd=REPO_ROOT / "multi-agent-service",
            check=True,
            capture_output=True,
            text=True,
            env={**os.environ, "PYTHONPATH": str(REPO_ROOT / "multi-agent-service" / "app")},
        )
        print("Package import sanity: OK")
    except subprocess.CalledProcessError as exc:
        print("Package import sanity: FAIL")
        print(exc.stderr)
        return 1

    print("=" * 60)
    print("RESULT: PASS")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
