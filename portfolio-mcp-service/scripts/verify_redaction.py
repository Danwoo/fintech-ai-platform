"""계좌·카드 식별자 redaction 회귀 검증 — redact_secrets 계약.

계약:
  (1) 라벨(account_no/계좌번호/카드번호…)+값은 **값 전체**가 마스킹된다. 구분자는 :/=/전각 콜론(：)/공백
      모두 받고, 값이 공백으로 쪼개져도('5012 01 2345678') 꼬리가 남지 않는다.
      마커 존재가 아니라 **원문 숫자가 하나도 남지 않음**으로 검사한다 — 부분 마스킹 + 꼬리 누출 검출.
  (2) 라벨 없는 bare 계좌·카드는 가운데만 가리는 부분 마스킹이 계약 — 원문 토큰 전체가 남으면 안 된다.
      한글 인접('계좌5012-01-2345678') 에서도 경계가 잡힌다.
  (3) 오탐 금지 — 라벨 뒤 값이 숫자형이 아니면(예: 'account_no is required', '계좌번호 확인 요망')
      건드리지 않는다. 라벨 없는 무관 텍스트(종목명·수량·코드)도 그대로.
      YYYY-MM-DD 날짜(예: '회사채 2024-05-15 만기')는 bare 계좌 패턴이 오탐하지 않는다.
  (4) 값 뒤에 이어지는 무관한 날짜·수치는 보존된다 (#37 "날짜·금액은 기능 데이터" 계약).
      개행 너머 다음 줄의 선두 숫자도 삼키지 않는다.

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

    # (1) 라벨+값 — 값 전체 마스킹. 값 밖에는 숫자를 두지 않은 케이스만 넣어,
    #     "출력에 숫자가 하나라도 남으면 부분 누출" 로 판정할 수 있게 한다.
    must_mask_whole = [
        "account_no 5012012345678",  # 공백 구분 + 연속 13자리
        "account_no: 5012-01-2345678",  # 기존 :/= KV
        "계좌번호 501201-23-45678",  # 공백 + 하이픈 값
        "카드번호 5012 0123 4567 8901",  # 공백 카드 16자리
        "account_no 5012 01 2345678",  # 값 내부 공백 분할 (#40)
        "계좌번호 501201 23 45678",  # 값 내부 공백 분할 — 꼬리 '23 45678' 누출 (#40)
        "계좌번호： 5012-01-2345678",  # 전각 콜론 (#40)
    ]
    for c in must_mask_whole:
        out = redact_secrets(c)
        if _MASK_MARK not in out:
            problems.append(f"미마스킹(누수): {c!r} → {out!r}")
        elif any(ch.isdigit() for ch in out):
            problems.append(f"부분 마스킹(꼬리 누출): {c!r} → {out!r}")

    # (2) 라벨 없는 bare 계좌·카드 — 부분 마스킹이 계약이므로 원문 토큰 전체가 사라졌는지만 본다
    must_mask_partial = [
        ("출금 계좌 5012-02-7654321 로 이체", "5012-02-7654321"),  # 문맥 속 하이픈 계좌
        ("계좌5012-01-2345678", "5012-01-2345678"),  # 한글 인접 — \b 불발 (#40)
    ]
    for c, raw_token in must_mask_partial:
        out = redact_secrets(c)
        if _MASK_MARK not in out:
            problems.append(f"미마스킹(누수): {c!r} → {out!r}")
        elif raw_token in out:
            problems.append(f"원문 토큰 잔존: {c!r} → {out!r}")

    # (3) 마스킹되면 안 되는 것 — 라벨 뒤 비숫자값, 라벨 없는 무관 텍스트
    must_keep = [
        "account_no is required",
        "계좌번호 확인 요망",
        "보유수량 300주",
        "삼성전자 005930 보유",
        "회사채 2024-05-15 만기",  # YYYY-MM-DD 날짜는 계좌가 아니다
        "회사채 2024-05-15만기",  # 한글 인접 날짜 — lookaround 전환에도 오탐 없음
    ]
    for c in must_keep:
        if _MASK_MARK in redact_secrets(c):
            problems.append(f"오탐(과마스킹): {c!r} → {redact_secrets(c)!r}")

    # (4) 값 뒤 무관 토큰 보존 — KV 값 마스킹이 날짜·다음 줄 수치를 삼키지 않는다
    must_preserve = [
        ("account_no: 5012012345678 2024-05-15 만기", "2024-05-15 만기"),
        ("계좌번호: 5012012345678\n2024-05-15 개설", "2024-05-15 개설"),
        ("계좌번호: 5012012345678\n300 잔고", "300 잔고"),
    ]
    for c, kept in must_preserve:
        out = redact_secrets(c)
        if kept not in out:
            problems.append(f"과잉 흡수(기능 데이터 파괴): {c!r} → {out!r}")

    if problems:
        print("redaction 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("redaction OK — 라벨+값 전체 마스킹(꼬리 누출 없음) · bare 부분 마스킹 · 오탐 없음 · 값 뒤 날짜·수치 보존")
    return 0


if __name__ == "__main__":
    sys.exit(main())
