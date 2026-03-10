from app.schemas.ai_request import AiRequest

def recommend_common_space(req: AiRequest) -> str:
    preferred_space_id = _to_int(req.get_slot("space_id"))
    building_id        = _to_int(req.get_slot("building_id"))
    usage_pattern      = str(req.get_slot("usage_pattern") or "").lower()
    preferred_start    = _extract_hour(req.get_slot("sr_start_at"))
    source_items       = _load_items(req)

    if not source_items:
        return "현재 예약 가능한 공용시설 정보가 없습니다."

    filtered = []
    for slot in source_items:
        space_id         = _to_int(_item_value(slot, "space_id", "spaceId"))
        item_building_id = _to_int(_item_value(slot, "building_id", "buildingId"))
        start_at = str(_item_value(slot, "start_at", "startAt") or "")

        if preferred_space_id is not None and space_id != preferred_space_id: continue
        if building_id is not None and item_building_id != building_id: continue
        if _is_time_mismatch(start_at, preferred_start, usage_pattern): continue

        enriched = dict(slot)
        enriched["_space_id"]   = space_id or 0
        enriched["_building_id"]= item_building_id or 0
        enriched["_space_name"] = str(_item_value(slot, "space_name", "spaceNm", "space_nm") or "공용시설")
        enriched["_start_at"]   = start_at
        enriched["_end_at"]     = str(_item_value(slot, "end_at", "endAt") or "")
        enriched["_score"]      = _to_int(_item_value(slot, "score")) or 0
        filtered.append(enriched)

    if not filtered:
        return "현재 조건에 맞는 공용시설 예약 가능 시간대가 없습니다. 시간대를 조정해서 다시 문의해 주세요."

    filtered.sort(key=lambda i: -i["_score"])
    top = filtered[:3]

    parts = [f"예약 가능한 공용시설이 {len(filtered)}개 있습니다. 추천 목록:"]
    for idx, item in enumerate(top, 1):
        start = item["_start_at"].replace("T", " ")[:16]
        end   = item["_end_at"].replace("T", " ")[:16]
        parts.append(f"{idx}. {item['_space_name']} | {start} ~ {end}")

    return "\n".join(parts)


def _to_int(value) -> int | None:
    try: return int(value) if value not in (None, "") else None
    except: return None

def _extract_hour(value) -> int | None:
    text = str(value or "")
    text = text[11:13] if "T" in text and len(text) >= 13 else text[:2]
    try: return int(text)
    except: return None

def _is_time_mismatch(start_at, preferred_start, usage_pattern) -> bool:
    hour = _extract_hour(start_at)
    if preferred_start is not None and hour is not None and abs(hour - preferred_start) > 2: return True
    if "evening" in usage_pattern and hour is not None and hour < 17: return True
    if "morning" in usage_pattern and hour is not None and hour > 12: return True
    return False

def _load_items(req: AiRequest) -> list[dict]:
    items = req.get_slot("items")
    return [i for i in items if isinstance(i, dict)] if isinstance(items, list) else []

def _item_value(item, *keys):
    for k in keys:
        if k in item: return item[k]
    return None