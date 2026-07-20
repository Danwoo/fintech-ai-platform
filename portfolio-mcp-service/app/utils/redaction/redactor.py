"""계좌번호·카드번호 등 자유텍스트에 섞인 민감 식별자를 마스킹 (노출 전 결정론적 전처리).

브로커리지/포트폴리오 데이터(계좌·거래·주문·활동 라인)는 챗 에이전트(LLM)·리포트로 흘러가므로,
계좌번호 같은 식별자가 그대로 노출되지 않도록 이 모듈이 **데이터 소스(portfolio-mcp)에서** 마스킹한다.
- **계좌/카드 식별자 전용** — 그 외 개인정보(주민번호 등)는 LiteLLM 게이트웨이 PiiMaskGuard 가 LLM 입력단에서 담당(역할분담).
  식별자는 게이트웨이(LLM 경계)가 아니라 **source 에서** 가려, 서비스 밖(전송·로그·리포트·LLM)으로 아예 안 내보낸다.
- 짧은 라벨/계좌번호 대상이라 오탐을 줄이려 **고정 포맷만** 매칭한다(브로커 계좌번호·카드번호 형태).
  high-entropy 추정 마스킹은 하지 않는다.
- 계좌번호는 가운데 자릿수만 가리고 앞뒤 일부는 남겨 식별성을 유지한다(전액 마스킹 아님).
- 종목명·티커·금액(기능상 필요) 은 건드리지 않는다 (계좌·카드 식별자만 대상).
"""

import re

_MASK = "[계좌번호 일부 가려짐]"


def _mask_account_no(m: re.Match) -> str:
    """계좌번호/카드번호의 가운데를 가리고 앞 2 · 뒤 2 그룹만 남긴다 (구분자 유지)."""
    raw = m.group(0)
    digit_groups = re.findall(r"\d+", raw)
    if len(digit_groups) < 3:
        return _MASK
    return f"{digit_groups[0]}-{_MASK}-{digit_groups[-1]}"


# 매치를 마스킹. 순서 주의 — 라벨+값(kv) 전체를 먼저 가린 뒤 남은 bare 번호를 부분 마스킹한다
# (반대로 하면 부분 마스킹된 결과를 kv 패턴이 다시 잘라 토큰이 깨진다).
_PATTERNS: list[tuple[re.Pattern, object]] = [
    # 'account_no: ...' / '계좌번호 5012012345678' 형태의 라벨+값 — 값 전체 마스킹 (먼저).
    # 구분자는 :/=/：(전각) 뿐 아니라 공백도 받고, 값은 공백으로 쪼개진 다토큰 숫자열이어도 통째로 가린다
    # (공백 구분일 땐 값 전체가 6자+ 숫자형일 때만 — 오탐 방지).
    (
        re.compile(
            r"(?i)\b(?:account[_-]?no|account[_-]?number|계좌번호|카드번호)\b"
            r"(?:\s*[:=：]\s*\S+(?:\s+\d[\d-]*)*"
            r"|\s+(?=\d(?:[\d-]|\s+(?=\d)){5,})\d[\d-]*(?:\s+\d[\d-]*)*)"
        ),
        _MASK,
    ),
    # 카드번호 (16자리, 4-4-4-4 / 공백 / 연속) — 전체 카드번호는 부분 마스킹
    (re.compile(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b"), _mask_account_no),
    # 브로커 계좌번호 (3~4 그룹, 하이픈 구분, 예: 123-45-678901 / 5012-01-2345678) — YYYY-MM-DD 날짜 형태는 제외.
    # 경계는 \b 대신 숫자 lookaround — 한글 등 \w 문자에 붙은 번호도 잡되 숫자에 이어진 건 제외.
    (re.compile(r"(?<!\d)(?!\d{4}-\d{2}-\d{2}(?!\d))\d{2,6}-\d{2,6}-\d{2,8}(?:-\d{1,8})?(?!\d)"), _mask_account_no),
]


def redact_secrets(text: str | None) -> str:
    """text 에 섞인 계좌번호/카드번호 등 식별자를 마스킹해 반환. None/빈 문자열은 빈 문자열로."""
    if not text:
        return text or ""
    for pat, repl in _PATTERNS:
        text = pat.sub(repl, text)
    return text
