from app.schemas.ai_request import AiRequest

LOW_STOCK_THRESHOLD = 5
DEFAULT_ITEMS = [
    {"building_id": 1, "prod_id": 1001, "prod_nm": "Laundry Detergent", "prod_stock": 3, "affiliate_id": 501},
    {"building_id": 1, "prod_id": 1002, "prod_nm": "Toilet Paper", "prod_stock": 12, "affiliate_id": 502},
    {"building_id": 2, "prod_id": 1003, "prod_nm": "Shampoo", "prod_stock": 4, "affiliate_id": 503},
]


def monitor_roomservice_stock(req: AiRequest) -> tuple[float, str, dict]:
    items = _collect_items(req)
    if not items:
        return 0.55, "No stock data is available for monitoring.", {"required_orders": 0}

    shortage = [item for item in items if item["prod_stock"] <= LOW_STOCK_THRESHOLD]
    if not shortage:
        return 0.7, "Current stock levels are stable. No order is required.", {"required_orders": 0}

    shortage.sort(key=lambda item: item["prod_stock"])
    lead = shortage[0]
    others = max(len(shortage) - 1, 0)
    suffix = f" plus {others} more item(s)" if others else ""
    message = (
        f"Building {lead['building_id']} / {lead['prod_nm']} / stock {lead['prod_stock']}{suffix} "
        f"need purchase orders. Generate purchase document now?"
    )
    metadata = {"required_orders": len(shortage), "items": shortage}
    return 0.9, message, metadata


def _collect_items(req: AiRequest) -> list[dict]:
    slot_items = req.get_slot("items")
    if isinstance(slot_items, list) and slot_items:
        parsed = [_normalize_item(item) for item in slot_items if isinstance(item, dict)]
        normalized = [item for item in parsed if item is not None]
        if normalized:
            return normalized

    single_item = _normalize_item(
        {
            "building_id": req.get_slot("building_id"),
            "prod_id": req.get_slot("prod_id"),
            "prod_nm": req.get_slot("prod_nm"),
            "prod_stock": req.get_slot("prod_stock"),
            "affiliate_id": req.get_slot("affiliate_id"),
        }
    )
    if single_item is not None:
        return [single_item]

    building_id = _to_int(req.get_slot("building_id"))
    if building_id is None:
        return DEFAULT_ITEMS
    return [item for item in DEFAULT_ITEMS if item["building_id"] == building_id]


def _normalize_item(item: dict) -> dict | None:
    building_id = _to_int(item.get("building_id"))
    prod_id = _to_int(item.get("prod_id"))
    prod_nm = str(item.get("prod_nm") or "").strip()
    prod_stock = _to_int(item.get("prod_stock"))
    affiliate_id = _to_int(item.get("affiliate_id"))

    if prod_stock is None:
        return None

    return {
        "building_id": building_id if building_id is not None else 0,
        "prod_id": prod_id if prod_id is not None else 0,
        "prod_nm": prod_nm if prod_nm else "Unknown Product",
        "prod_stock": prod_stock,
        "affiliate_id": affiliate_id if affiliate_id is not None else 0,
    }


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
