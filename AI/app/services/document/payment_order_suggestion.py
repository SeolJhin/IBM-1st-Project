from __future__ import annotations

from typing import Any

from app.schemas.ai_request import AiRequest
from app.services.actions.event_sink import publish_action_event
from app.services.document.draft_writer import write_document_draft


def suggest_order_from_payment(req: AiRequest) -> tuple[str, dict[str, Any]]:
    building_id = _to_int(req.get_slot("building_id"))
    month = str(req.get_slot("month") or req.get_slot("billing_month") or "N/A")
    items = _load_items(req.get_slot("items"))
    if not items:
        return "결제/주문 기반 데이터가 없습니다.", {"suggestions": [], "month": month}

    candidates: list[dict[str, Any]] = []
    for item in items:
        item_building = _to_int(_item_value(item, "building_id", "buildingId"))
        if building_id is not None:
            if item_building != building_id:
                continue

        prod_nm = str(_item_value(item, "prod_nm", "prodNm", "name") or "Unknown Product")
        paid_amount = _to_int(_item_value(item, "paid_amount", "paidAmount", "amount")) or 0
        stock = _to_int(_item_value(item, "prod_stock", "prodStock", "stock"))
        affiliate_id = _to_int(_item_value(item, "affiliate_id", "affiliateId"))

        if stock is None:
            continue

        priority = _priority_score(stock=stock, paid_amount=paid_amount)
        if priority <= 0:
            continue

        unit_price = _to_int(_item_value(item, "prod_price", "unit_price")) or 0

        candidates.append(
            {
                "building_id": item_building or 0,
                "prod_nm": prod_nm,
                "prod_stock": stock,
                "paid_amount": paid_amount,
                "affiliate_id": affiliate_id or 0,
                "priority": priority,
                "order_qty": _suggest_order_qty(stock),
                "unit_price": unit_price,
            }
        )

    if not candidates:
        return "발주 추천할 품목이 없습니다. 모든 상품의 재고가 충분합니다.", {"suggestions": [], "month": month}

    candidates.sort(key=lambda x: (-x["priority"], x["prod_stock"]))
    top = candidates[:5]
    summary = " / ".join(
        f"{item['prod_nm']} (stock={item['prod_stock']}, priority={item['priority']})"
        for item in top
    )
    message = f"Order suggestion document draft generated for {month}: {summary}"
    draft_payload = {
        "month": month,
        "building_id": building_id,
        "suggestions": top,
    }
    draft_path = write_document_draft("payment_order_suggestion", payload=draft_payload, user_id=req.user_id)
    event = publish_action_event(
        "payment_order_suggestion_created",
        {"user_id": req.user_id, "draft_path": draft_path, "month": month, "suggestions": top},
    )
    return message, {"suggestions": top, "month": month, "draft_path": draft_path, "event_status": event}


def _priority_score(stock: int, paid_amount: int) -> int:
    if stock <= 3:
        return 3
    if stock <= 7 and paid_amount >= 100000:
        return 2
    if stock <= 10 and paid_amount >= 300000:
        return 1
    return 0


def _suggest_order_qty(stock: int) -> int:
    target_stock = 12
    qty = target_stock - stock
    return qty if qty > 0 else 1


def _load_items(value: object) -> list[dict]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _item_value(item: dict, *keys: str) -> object:
    for key in keys:
        if key in item:
            return item[key]
    return None


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
