from datetime import datetime

from app.schemas.ai_request import AiRequest

HIGH_PRIORITY_WORDS = {"urgent", "asap", "immediately", "right now", "critical", "emergency", "help"}
MEDIUM_PRIORITY_WORDS = {"fast", "quick", "soon", "problem", "issue", "noise", "contract"}


def classify_complain_priority(req: AiRequest) -> tuple[int, str]:
    source_item = _resolve_source_item(req)
    comp_id = _to_int(req.get_slot("comp_id")) or _to_int(req.get_slot("compId"))

    title = str(req.get_slot("comp_title") or req.get_slot("compTitle") or "")
    content = str(req.get_slot("comp_ctnt") or req.get_slot("compCtnt") or "")
    comp_st = str(req.get_slot("comp_st") or req.get_slot("compSt") or "")
    keyword = str(req.get_slot("keyword") or "")
    override_score = _to_float(req.get_slot("priority_score"))

    if source_item is not None:
        comp_id = comp_id or _to_int(_item_value(source_item, "comp_id", "compId"))
        if not title:
            title = str(_item_value(source_item, "comp_title", "compTitle") or "")
        if not content:
            content = str(_item_value(source_item, "comp_ctnt", "compCtnt") or "")
        if not comp_st:
            comp_st = str(_item_value(source_item, "comp_st", "compSt") or "")
        if not keyword:
            keyword = str(_item_value(source_item, "code", "keyword") or "")
        if override_score is None:
            override_score = _to_float(_item_value(source_item, "priority_score", "priorityScore"))

    if override_score is not None:
        priority = _priority_from_override(override_score)
    else:
        priority = _priority_from_text(" ".join([title, content, keyword, comp_st]))
        priority = max(priority, _history_floor(req))

    stars = "*" * priority
    created_at = _resolve_created_date(source_item)
    comp_id_text = str(comp_id) if comp_id is not None else "1"
    status_text = comp_st or "requested"
    message = (
        f"id | type | title | status | date | priority\n"
        f"{comp_id_text} | complain | {title or 'N/A'} | {status_text} | {created_at} | {stars}"
    )
    return priority, message


def _priority_from_override(value: float) -> int:
    if value >= 2.5:
        return 3
    if value >= 1.5:
        return 2
    return 1


def _priority_from_text(text: str) -> int:
    lowered = text.lower()
    high_hits = sum(1 for word in HIGH_PRIORITY_WORDS if word in lowered)
    medium_hits = sum(1 for word in MEDIUM_PRIORITY_WORDS if word in lowered)
    exclamation_bonus = 1 if "!" in text else 0

    score = high_hits * 2 + medium_hits + exclamation_bonus
    if score >= 4:
        return 3
    if score >= 2:
        return 2
    return 1


def _to_float(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _resolve_source_item(req: AiRequest) -> dict | None:
    items = req.get_slot("items")
    if not isinstance(items, list):
        return None

    comp_id = _to_int(req.get_slot("comp_id")) or _to_int(req.get_slot("compId"))
    if comp_id is not None:
        for item in items:
            if not isinstance(item, dict):
                continue
            item_comp_id = _to_int(_item_value(item, "comp_id", "compId"))
            if item_comp_id == comp_id:
                return item

    sorted_items = [item for item in items if isinstance(item, dict)]
    if not sorted_items:
        return None
    sorted_items.sort(key=lambda item: _item_datetime(item), reverse=True)
    return sorted_items[0]


def _history_floor(req: AiRequest) -> int:
    items = req.get_slot("items")
    if not isinstance(items, list):
        return 1

    unresolved = 0
    for item in items:
        if not isinstance(item, dict):
            continue
        status = str(_item_value(item, "comp_st", "compSt") or "").lower()
        if status in {"received", "in_progress", "requested"}:
            unresolved += 1

    if unresolved >= 3:
        return 3
    if unresolved >= 2:
        return 2
    return 1


def _resolve_created_date(source_item: dict | None) -> str:
    if source_item is None:
        return datetime.now().date().isoformat()
    dt = _item_datetime(source_item)
    if dt is None:
        return datetime.now().date().isoformat()
    return dt.date().isoformat()


def _item_value(item: dict, *keys: str) -> object:
    for key in keys:
        if key in item:
            return item[key]
    return None


def _item_datetime(item: dict) -> datetime | None:
    value = _item_value(item, "created_at", "createdAt")
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00").replace(" ", "T"))
    except ValueError:
        return None
