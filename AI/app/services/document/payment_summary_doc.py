from datetime import date, datetime

from app.schemas.ai_request import AiRequest


def make_payment_summary(req: AiRequest) -> str:
    if req.intent == "PAYMENT_STATUS_SUMMARY":
        return _build_payment_status_summary(req)
    return _build_payment_document_summary(req)


def _build_payment_document_summary(req: AiRequest) -> str:
    month = str(req.get_slot("month") or req.get_slot("billing_month") or "N/A")
    payment_id = str(req.get_slot("payment_id") or "N/A")
    total_price = _to_int(req.get_slot("total_price"))
    paid_at = str(req.get_slot("paid_at") or "unpaid")
    target_type = str(req.get_slot("target_type") or "general")

    price_text = f"{total_price} KRW" if total_price is not None else "N/A"
    return (
        f"Payment summary document is ready. "
        f"month={month}, paymentId={payment_id}, amount={price_text}, paidAt={paid_at}, target={target_type}."
    )


def _build_payment_status_summary(req: AiRequest) -> str:
    billing_month = str(req.get_slot("billing_month") or req.get_slot("month") or "N/A")
    payment_st = str(req.get_slot("payment_st") or "UNKNOWN").upper()
    charge_status = str(req.get_slot("charge_status") or "UNKNOWN").upper()
    due_date_raw = req.get_slot("due_date")

    due_date = _to_date(due_date_raw)
    due_text = "N/A"
    if due_date is not None:
        days_left = (due_date - date.today()).days
        if days_left < 0:
            due_text = f"overdue by {-days_left} day(s)"
        elif days_left == 0:
            due_text = "due today"
        else:
            due_text = f"D-{days_left}"

    return (
        f"Payment status summary: month={billing_month}, paymentStatus={payment_st}, "
        f"chargeStatus={charge_status}, due={due_text}."
    )


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_date(value: object) -> date | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text[:10]).date()
    except ValueError:
        return None
