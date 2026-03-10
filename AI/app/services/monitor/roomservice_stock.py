from app.schemas.ai_request import AiRequest
from app.services.actions.event_sink import publish_action_event
from app.services.document.draft_writer import write_document_draft

LOW_STOCK_THRESHOLD = 5

def monitor_roomservice_stock(req: AiRequest) -> tuple[float, str, dict]:
    items = _collect_items(req)
    if not items:
        return 0.55, "현재 조회 가능한 재고 데이터가 없습니다.", {"required_orders": 0}

    shortage = [i for i in items if i["prod_stock"] <= LOW_STOCK_THRESHOLD]
    if not shortage:
        return 0.7, "현재 모든 재고가 안정적입니다. 추가 발주가 필요하지 않습니다.", {"required_orders": 0}

    shortage.sort(key=lambda i: i["prod_stock"])
    parts = [f"재고 부족 항목이 {len(shortage)}개 발견되었습니다. 발주가 필요합니다.\n"]
    for idx, item in enumerate(shortage[:5], 1):
        parts.append(
            f"{idx}. {item['prod_nm']} | 빌딩 {item['building_id']} | "
            f"현재 재고: {item['prod_stock']}개 (기준: {LOW_STOCK_THRESHOLD}개 이하)"
        )

    draft_payload = {"required_orders": len(shortage), "items": shortage}
    draft_path = write_document_draft("roomservice_order_suggestion", payload=draft_payload, user_id=req.user_id)
    event = publish_action_event(
        "roomservice_stock_shortage_detected",
        {"user_id": req.user_id, "draft_path": draft_path, "required_orders": len(shortage), "items": shortage},
    )
    metadata = {"required_orders": len(shortage), "items": shortage, "draft_path": draft_path, "event_status": event}
    return 0.9, "\n".join(parts), metadata


def _collect_items(req: AiRequest) -> list[dict]:
    slot_items = req.get_slot("items")
    if isinstance(slot_items, list) and slot_items:
        parsed = [_normalize_item(i) for i in slot_items if isinstance(i, dict)]
        normalized = [i for i in parsed if i is not None]
        if normalized: return normalized
    single = _normalize_item({
        "building_id": req.get_slot("building_id"),
        "prod_id":     req.get_slot("prod_id"),
        "prod_nm":     req.get_slot("prod_nm"),
        "prod_stock":  req.get_slot("prod_stock"),
        "affiliate_id":req.get_slot("affiliate_id"),
    })
    return [single] if single else []

def _normalize_item(item: dict) -> dict | None:
    prod_stock = _to_int(item.get("prod_stock"))
    if prod_stock is None: return None
    return {
        "building_id":  _to_int(item.get("building_id")) or 0,
        "prod_id":      _to_int(item.get("prod_id"))      or 0,
        "prod_nm":      str(item.get("prod_nm") or "알 수 없는 상품").strip(),
        "prod_stock":   prod_stock,
        "affiliate_id": _to_int(item.get("affiliate_id")) or 0,
    }

def _to_int(value) -> int | None:
    try: return int(value) if value not in (None, "") else None
    except: return None
