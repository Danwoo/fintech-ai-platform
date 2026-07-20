"""계좌·카드 식별자 redaction 회귀 검증 — redact_secrets 계약.

계약:
  (1) 라벨(account_no/계좌번호/카드번호…)+값은 구분자가 :/=/：(전각) 뿐 아니라 공백이어도,
      값이 공백으로 쪼개진 다토큰 숫자열이어도 **값 전체가** 마스킹된다 — 첫 토큰만 가리고
      꼬리가 새는 부분 마스킹은 위반이다.
  (2) 라벨 없는 하이픈 계좌·16자리 카드는 부분 마스킹(앞·뒤 그룹만 잔류)이 유지된다 — 한글 등
      단어 문자에 붙어 있어도 잡힌다 (경계는 word boundary 가 아니라 숫자 lookaround).
  (3) 오탐 금지 — 라벨 뒤 값이 숫자형이 아니면(예: 'account_no is required', '계좌번호 확인 요망')
      건드리지 않는다. 라벨 없는 무관 텍스트(종목명·수량·코드)도 그대로.
      YYYY-MM-DD 날짜(예: '회사채 2024-05-15 만기')는 bare 계좌 패턴이 오탐하지 않는다.

판정 기준: 마스킹 마커 존재만으로는 부족하다(부분 마스킹 + 꼬리 누출이 green 으로 통과함) —
원문 숫자열의 부분 누출 부재까지 검사한다.

순수 함수 검사 — DB/LLM/외부 API 불필요. `uv run python scripts/verify_redaction.py` (cwd=서비스 루트).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))

from utils.redaction.redactor import redact_secrets  # noqa: E402

_MASK_MARK = "가려짐"
_MASK = "[계좌번호 일부 가려짐]"


def main() -> int:
    problems: list[str] = []

    # (1) 라벨+값 — 값 전체 마스킹: 마커가 있고 원문의 숫자 런이 하나도 새지 않아야 한다
    must_mask_full = [
        "account_no 5012012345678",  # 공백 구분 + 연속 13자리 (구 KV 가 놓치던 누수)
        "account_no: 5012-01-2345678",  # 기존 :/= KV
        "계좌번호 501201-23-45678",  # 공백 + 하이픈 값
        "카드번호 5012 0123 4567 8901",  # 공백 카드 16자리
        "account_no 5012 01 2345678",  # 공백 분할 다토큰 값 (이슈 #40 프로브)
        "계좌번호 501201 23 45678",  # 공백 분할 + 꼬리 누출 (이슈 #40 프로브)
        "계좌번호： 5012-01-2345678",  # 전각 콜론 구분자 (이슈 #40 프로브)
    ]
    for c in must_mask_full:
        out = redact_secrets(c)
        leaked = [run for run in re.findall(r"\d+", c) if run in out]
        if _MASK_MARK not in out or leaked:
            problems.append(f"미마스킹(누수): {c!r} → {out!r} (잔류 숫자열: {leaked})")

    # (2) 라벨 없는 bare 번호 — 부분 마스킹 계약(앞·뒤 그룹 잔류, 가운데는 마커)을 정확히 만족해야 한다
    must_mask_partial = {
        "출금 계좌 5012-02-7654321 로 이체": f"출금 계좌 5012-{_MASK}-7654321 로 이체",
        "계좌5012-01-2345678": f"계좌5012-{_MASK}-2345678",  # 한글 인접 경계 (이슈 #40 프로브)
    }
    for c, expected in must_mask_partial.items():
        out = redact_secrets(c)
        if out != expected:
            problems.append(f"부분 마스킹 계약 위반: {c!r} → {out!r} (기대: {expected!r})")

    # (3) 마스킹되면 안 되는 것 — 라벨 뒤 비숫자값, 라벨 없는 무관 텍스트, 날짜
    must_keep = [
        "account_no is required",
        "계좌번호 확인 요망",
        "보유수량 300주",
        "삼성전자 005930 보유",
        "회사채 2024-05-15 만기",  # YYYY-MM-DD 날짜는 계좌가 아니다
        "회사채 2024-05-15만기",  # 한글이 붙어도 날짜다
    ]
    for c in must_keep:
        if _MASK_MARK in redact_secrets(c):
            problems.append(f"오탐(과마스킹): {c!r} → {redact_secrets(c)!r}")

    if problems:
        print("redaction 위반:")
        for p in problems:
            print(f"  - {p}")
        return 1
    print(
        "redaction OK — 라벨+값 전체 마스킹(공백 분할·전각 콜론 포함) · bare 부분 마스킹 유지(한글 인접 포함) · 오탐 없음"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
