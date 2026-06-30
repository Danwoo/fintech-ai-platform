"""DevExtreme 파라미터 파싱 및 SQL 변환 유틸리티"""

import json
import re
from typing import Any

from core.exceptions import BadRequestError

# SQL 식별자 검증: 알파벳, 숫자, 밑줄만 허용 (SQL injection 방지)
_SAFE_IDENTIFIER_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")


def _validate_identifier(name: str) -> str:
    """SQL 식별자(컬럼명/필드명)가 안전한지 검증"""
    if not name or not _SAFE_IDENTIFIER_RE.match(name):
        raise BadRequestError(f"유효하지 않은 필드명입니다: {name}")
    return name


def parse_filter_sort(
    filter: str | None = None,
    sort: str | None = None,
) -> tuple[Any, Any]:
    """DevExtreme 그리드 filter/sort 파라미터 파싱

    Args:
        filter: JSON 문자열 형태의 필터 조건
        sort: JSON 문자열 형태의 정렬 조건

    Returns:
        tuple[Any, Any]: (filter_obj, sort_obj) 파싱된 객체 튜플

    Raises:
        HTTPException: JSON 파싱 실패 시 400 에러
    """
    try:
        filter_obj = json.loads(filter) if filter else None
        sort_obj = json.loads(sort) if sort else None
        return filter_obj, sort_obj
    except json.JSONDecodeError as e:
        raise BadRequestError("잘못된 filter/sort 형식입니다.") from e


def parse_sort(sort_obj) -> str | None:
    """DevExtreme sort 배열을 SQL ORDER BY 문자열로 변환"""
    if isinstance(sort_obj, str):
        try:
            sort_obj = json.loads(sort_obj)
        except json.JSONDecodeError:
            return None

    if isinstance(sort_obj, list) and len(sort_obj) > 0:
        sort_clauses = []
        for s in sort_obj:
            selector = s.get("selector")
            desc = s.get("desc", False)
            if selector:
                _validate_identifier(selector)
                sort_clauses.append(f"{selector} {'DESC' if desc else 'ASC'}")
        return ", ".join(sort_clauses)

    return None


def filter_condition(field, op, param_name, value=None) -> str:
    """DevExtreme 필터 연산자를 SQL WHERE 조건으로 변환"""
    conditions = {
        "contains": f"{field} LIKE '%' + :{param_name} + '%'",
        "notcontains": f"{field} NOT LIKE '%' + :{param_name} + '%'",
        "startswith": f"{field} LIKE :{param_name} + '%'",
        "endswith": f"{field} LIKE '%' + :{param_name}",
        ">": f"{field} > :{param_name}",
        ">=": f"{field} >= :{param_name}",
        "<": f"{field} < :{param_name}",
        "<=": f"{field} <= :{param_name}",
        "between": f"({field} BETWEEN :{param_name}_start AND :{param_name}_end)",
        "isblank": f"({field} IS NULL OR {field} = '')",
        "isnotblank": f"({field} IS NOT NULL AND {field} <> '')",
    }

    if op in conditions:
        return conditions[op]
    elif op == "=":
        return f"{field} = :{param_name}" if value is not None else f"{field} IS NULL"
    elif op in ("<>", "!="):
        return f"{field} <> :{param_name}" if value is not None else f"{field} IS NOT NULL"
    elif op in ("in", "anyof"):
        return f"{field} IN :{param_name}"
    elif op in ("notin", "noneof"):
        return f"{field} NOT IN :{param_name}"
    else:
        raise BadRequestError(f"지원하지 않는 연산자: {op}")


def parse_filter(filter_obj, param_index=0) -> tuple[str, dict]:
    """DevExtreme filter 포맷을 SQL WHERE로 변환"""
    if isinstance(filter_obj, str):
        try:
            filter_obj = json.loads(filter_obj)
        except json.JSONDecodeError:
            return "", {}

    if not isinstance(filter_obj, list):
        return "", {}

    # NOT 조건: ["!", condition]
    if len(filter_obj) == 2 and filter_obj[0] == "!":
        sub_sql, sub_params = parse_filter(filter_obj[1], param_index)
        if sub_sql:
            return f"NOT {sub_sql}", sub_params
        return "", {}

    # 단일 조건: ["field", "operator", value]
    if len(filter_obj) == 3 and isinstance(filter_obj[0], str):
        field, op, value = filter_obj

        _validate_identifier(field)
        param_name = f"filter_param_{param_index}"
        sql = filter_condition(field, op, param_name, value)

        params = {}
        if op == "between" and isinstance(value, list) and len(value) == 2:
            params[f"{param_name}_start"] = value[0]
            params[f"{param_name}_end"] = value[1]
        elif op in ("isblank", "isnotblank"):
            pass  # SQL에 값 파라미터 없음
        elif op in ("in", "anyof", "notin", "noneof"):
            params[param_name] = value
        else:
            params[param_name] = value

        return sql, params

    # 논리 연산자(AND/OR) 및 중첩 처리
    sub_sqls = []
    params = {}
    i = param_index

    for item in filter_obj:
        if isinstance(item, list):
            sub_sql, sub_params = parse_filter(item, i)
            if sub_sql:
                sub_sqls.append(sub_sql)
            params.update(sub_params)
            i += len(sub_params) if sub_params else 1
        elif isinstance(item, str) and item.lower() in ("and", "or"):
            sub_sqls.append(item.upper())

    sql = f"({' '.join(sub_sqls)})" if sub_sqls else ""
    return sql, params


def build_filter_params(args: dict) -> tuple[str, dict]:
    """필터 파라미터 빌드"""
    sql_where, sql_params = "", {}
    filter_obj = args.get("filter")

    if filter_obj:
        filter_sql, filter_params = parse_filter(filter_obj)
        if filter_sql:
            sql_where += f" AND {filter_sql}"
        sql_params.update(filter_params)

    return sql_where, sql_params
