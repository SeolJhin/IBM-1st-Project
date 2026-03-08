from app.schemas.ai_request import AiRequest


def recommend_common_space(req: AiRequest) -> str:
    preferred_space_id = _to_int(req.get_slot("space_id"))
    building_id = _to_int(req.get_slot("building_id"))
    usage_pattern = str(req.get_slot("usage_pattern") or "").lower()
    preferred_start = _extract_hour(req.get_slot("sr_start_at"))
    source_items = _load_items(req)

    if not source_items:
        return "No common-space availability data was provided."

    filtered = []
    for slot in source_items:
        space_id = _to_int(_item_value(slot, "space_id", "spaceId"))
        item_building_id = _to_int(_item_value(slot, "building_id", "buildingId"))
        start_at = str(_item_value(slot, "start_at", "startAt") or "")
        if preferred_space_id is not None and space_id != preferred_space_id:
            continue
        if building_id is not None and item_building_id != building_id:
            continue
        if _is_time_mismatch(start_at, preferred_start, usage_pattern):
            continue

        enriched = dict(slot)
        enriched["_space_id"] = space_id if space_id is not None else 0
        enriched["_building_id"] = item_building_id if item_building_id is not None else 0
        enriched["_space_name"] = str(_item_value(slot, "space_name", "spaceNm", "space_name") or "Unknown Space")
        enriched["_start_at"] = start_at
        enriched["_end_at"] = str(_item_value(slot, "end_at", "endAt") or "")
        enriched["_score"] = _to_int(_item_value(slot, "score")) or 0
        filtered.append(enriched)

    if not filtered:
        return "No suitable common-space slot was found. Please try a wider time range."

    filtered.sort(key=lambda item: -item["_score"])
    top = filtered[:2]
    primary = top[0]

    detail = (
        f"{primary['_space_name']} ({primary['_start_at']} to {primary['_end_at']})"
        f" in building {primary['_building_id']} is available."
    )

    if len(top) > 1:
        secondary = top[1]
        detail += (
            f" Alternative: {secondary['_space_name']} "
            f"({secondary['_start_at']} to {secondary['_end_at']})."
        )

    return f"Recommended common-space reservation: {detail} Would you like to book now?"


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_hour(value: object) -> int | None:
    text = str(value or "")
    if "T" in text and len(text) >= 13:
        text = text[11:13]
    elif len(text) >= 2:
        text = text[:2]
    else:
        return None
    try:
        return int(text)
    except ValueError:
        return None


def _is_time_mismatch(start_at: str, preferred_start: int | None, usage_pattern: str) -> bool:
    hour = _extract_hour(start_at)
    if preferred_start is not None and hour is not None and abs(hour - preferred_start) > 2:
        return True
    if "evening" in usage_pattern and hour is not None and hour < 17:
        return True
    if "morning" in usage_pattern and hour is not None and hour > 12:
        return True
    return False


def _load_items(req: AiRequest) -> list[dict]:
    items = req.get_slot("items")
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict)]


def _item_value(item: dict, *keys: str) -> object:
    for key in keys:
        if key in item:
            return item[key]
    return None
