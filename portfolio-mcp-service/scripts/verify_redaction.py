"""계좌·카드 식별자 redaction 회귀 검증 — redact_secrets 계약.

계약:
  (1) 라벨(account_no/계좌번호/카드번호…)+값은 구분자가 :/= 뿐 아니라 공백이어도 마스킹된다
      — 공백 구분 + 연속 숫자(예: 'account_no 5012012345678')가 새지 않는다.
  (2) 기존 :/= KV·하이픈 계좌·16자리 카드 마스킹은 회귀 없이 유지.
  (3) 오탐 금지 — 라벨 뒤 값이 숫자형이 아니면(예: 'account_no is required', '계좌번호 확인 요망')
      건드리지 않는다. 라벨 없는 무관 텍스트(종목명·수량·코드)도 그대로.
      YYYY-MM-DD 날짜(예: '회사채 2024-05-15 만기')는 bare 계좌 패턴이 오탐하지 않는다.

순수 함수 검사 — DB/LLM/외부 API 불필요. `uv run python scripts/verify_redaction.py` (cwd=서비스 루트).
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from utils.redaction.redactor import redact_secrets  # noqa: E402

_MASK_MARK = "가려짐"


def main() -> int:
    problems: list[str] = []

    # (1)+(2) 마스킹돼야 하는 것 — 라벨+값(공백/구분자 무관), 하이픈 계좌, 16자리 카드
    must_mask = [
        "account_no 5012012345678",  # 공백 구분 + 연속 13자리 (구 KV 가 놓치던 누수)
        "account_no: 5012-01-2345678",  # 기존 :/= KV
        "계좌번호 501201-23-45678",  # 공백 + 하이픈 값
        "카드번호 5012 0123 4567 8901",  # 공백 카드 16자리
        "출금 계좌 5012-02-7654321 로 이체",  # 문맥 속 하이픈 계좌
    ]
    for c in must_mask:
        if _MASK_MARK not in redact_secrets(c):
            problems.append(f"미마스킹(누수): {c!r} → {redact_secrets(c)!r}")

    # (3) 마스킹되면 안 되는 것 — 라벨 뒤 비숫자값, 라벨 없는 무관 텍스트
    must_keep = [
        "account_no is required",
        "계좌번호 확인 요망",
        "보유수량 300주",
        "삼성전자 005930 보유",
        "회사채 2024-05-15 만기",  # YYYY-MM-DD 날짜는 계좌가 아니다
    ]
    for c in must_keep:
        if _MASK_MARK in redact_secrets(c):
            problems.append(f"오탐(과마스킹): {c!r} → {redact_secrets(c)!r}")

    if problems:
        print("redaction 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("redaction OK — 라벨+값 공백 구분자 포함 마스킹 · 기존 KV/계좌/카드 유지 · 비숫자값·무관 텍스트 오탐 없음")
    return 0


if __name__ == "__main__":
    sys.exit(main())
