# utils/portfolio/portfolio_utils.py
"""portfolio_service 의 순수 헬퍼 — since/until 정규화·보유/거래/주문/활동 라인 변환(계좌번호 마스킹 포함).

IO/DB 없는 순수 함수만 모은다(서비스에서 분리 → 단위 테스트 용이). 외부 시각(now)은 인자로 받는다.
자유텍스트(detail 등)는 redact_secrets() 로 계좌번호/카드번호를 마스킹한 뒤 노출한다 (그 외 PII 는 게이트웨이 PiiMaskGuard 담당).
"""

from datetime import timedelta

from utils.redaction.redactor import redact_secrets

_DEFAULT_QUERY_DAYS = 30  # since 미지정 시 최근 30일


def sum_by_currency(lines: list[dict], value_key: str) -> dict[str, float]:
    """lines 의 value_key 를 통화별로 합산. 환율 없이 통화를 섞어 더하면 무의미하므로 통화별로 분리한다."""
    totals: dict[str, float] = {}
    for line in lines:
        ccy = line.get("currency") or "KRW"
        totals[ccy] = totals.get(ccy, 0.0) + float(line.get(value_key) or 0)
    return {ccy: round(v, 2) for ccy, v in totals.items()}


def norm_since(s: str | None, now) -> str:
    """since 정규화: 미지정=최근 30일, bare 'YYYY-MM-DD'=그날 00:00 KST."""
    if not s:
        return (now - timedelta(days=_DEFAULT_QUERY_DAYS)).strftime("%Y-%m-%dT00:00:00+09:00")
    return f"{s}T00:00:00+09:00" if len(s) == 10 else s


def norm_until(s: str | None, now) -> str:
    """until 정규화: 미지정=현재, bare 'YYYY-MM-DD'=그날 23:59:59 KST (그날치 거래 누락 방지)."""
    if not s:
        return now.strftime("%Y-%m-%dT23:59:59+09:00")
    return f"{s}T23:59:59+09:00" if len(s) == 10 else s


def holding_line(account_id: str, h: dict) -> dict:
    """원시 보유 dict → 평가금액·평가손익·비중 계산된 구조화 라인."""
    qty = float(h.get("quantity") or 0)
    avg = float(h.get("avg_price") or 0)
    last = float(h.get("last_price") or 0)
    market_value = round(qty * last, 2)
    unrealized = round(market_value - avg * qty, 2)
    return {
        "account_id": account_id,
        "ticker": h.get("ticker") or "",
        "name": h.get("name") or "",
        "asset_class": h.get("asset_class") or "equity",
        "quantity": qty,
        "avg_price": avg,
        "last_price": last,
        "market_value": market_value,
        "unrealized_pnl": unrealized,
        "weight": 0.0,  # 계좌 평가자산 합산 후 service 가 채움
        "currency": h.get("currency") or "KRW",
    }


def tx_line(account_id: str, t: dict) -> dict:
    """원시 거래 dict → 구조화 라인 (금액 부호 그대로)."""
    return {
        "account_id": account_id,
        "trade_date": (t.get("trade_date") or "")[:10],
        "tx_type": t.get("tx_type") or "",
        "ticker": t.get("ticker") or "",
        "name": t.get("name") or "",
        "quantity": float(t.get("quantity") or 0),
        "price": float(t.get("price") or 0),
        "amount": float(t.get("amount") or 0),
        "currency": t.get("currency") or "KRW",
    }


def order_line(account_id: str, o: dict) -> dict:
    """원시 주문 dict → 구조화 라인."""
    return {
        "account_id": account_id,
        "order_id": o.get("order_id") or "",
        "ticker": o.get("ticker") or "",
        "name": o.get("name") or "",
        "side": o.get("side") or "",
        "order_type": o.get("order_type") or "limit",
        "status": o.get("status") or "",
        "quantity": float(o.get("quantity") or 0),
        "filled_quantity": float(o.get("filled_quantity") or 0),
        "price": float(o.get("price") or 0),
        "avg_fill_price": float(o.get("avg_fill_price") or 0),
        "placed_at": (o.get("placed_at") or "")[:10],
        "currency": o.get("currency") or "KRW",
    }


def event_line(e: dict) -> dict:
    """원시 활동 dict → 구조화 라인. detail 은 계좌번호/카드번호 마스킹."""
    return {
        "date": (e.get("date") or "")[:10],
        "action": e.get("action") or "",
        "detail": redact_secrets(e.get("detail") or ""),
        "amount": float(e.get("amount") or 0),
    }
