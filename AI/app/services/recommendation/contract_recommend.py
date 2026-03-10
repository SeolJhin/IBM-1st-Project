from datetime import date, datetime
from app.schemas.ai_request import AiRequest

def recommend_contract_rooms(req: AiRequest) -> str:
    contract_end_raw = req.get_slot("contract_end")
    building_id  = _to_int(req.get_slot("building_id"))
    current_rent = _to_int(req.get_slot("rent_price"))
    raw_items    = req.get_slot("items")

    candidates = _filter_candidates(raw_items, building_id, current_rent)
    if not candidates:
        return "죄송합니다. 현재 조건에 맞는 재계약 추천 방을 찾지 못했습니다."

    candidates.sort(key=lambda i: (_rent_distance(i["rent_price"], current_rent), -i["popularity"]))
    top = candidates[:3]
    day_text = _contract_day_text(contract_end_raw)

    parts = [f"{day_text}\n계약 갱신 추천 방 목록입니다:"]
    for idx, item in enumerate(top, 1):
        rent = item["rent_price"]
        diff = rent - current_rent if current_rent else 0
        diff_str = f" (현재 대비 {'+' if diff >= 0 else ''}{diff:,}원)" if current_rent else ""
        parts.append(f"{idx}. {item['name']} | 월세 {rent:,}원{diff_str}")

    return "\n".join(parts)


def _filter_candidates(raw_items, building_id, current_rent) -> list:
    if not isinstance(raw_items, list): return []
    filtered = []
    for item in raw_items:
        if not isinstance(item, dict): continue
        normalized = _normalize_item(item)
        if normalized is None: continue
        if building_id is not None and normalized["building_id"] != building_id: continue
        if current_rent is not None and _rent_distance(normalized["rent_price"], current_rent) > 200000: continue
        filtered.append(normalized)
    return filtered

def _normalize_item(item: dict) -> dict | None:
    rent = _to_int(_item_value(item, "rent_price", "rentPrice"))
    if rent is None: return None
    name = str(_item_value(item, "name", "building_nm", "room_name", "roomName") or "알 수 없는 방")
    return {
        "name":        name,
        "building_id": _to_int(_item_value(item, "building_id", "buildingId")) or 0,
        "rent_price":  rent,
        "popularity":  _to_int(_item_value(item, "popularity")) or 0,
    }

def _contract_day_text(contract_end_raw) -> str:
    end = _to_date(contract_end_raw)
    if end is None: return "계약 만료가 가까워지고 있습니다."
    days = (end - date.today()).days
    if days < 0:    return f"계약이 {-days}일 전에 만료되었습니다."
    if days <= 7:   return f"계약 만료까지 {days}일 남았습니다. (D-{days})"
    return f"계약 만료까지 {days}일 남았습니다."

def _item_value(item, *keys):
    for k in keys:
        if k in item: return item[k]
    return None

def _to_int(value) -> int | None:
    try: return int(value) if value not in (None, "") else None
    except: return None

def _to_date(value) -> date | None:
    if not value: return None
    try: return datetime.fromisoformat(str(value).strip()[:10]).date()
    except: return None

def _rent_distance(rent, current_rent) -> int:
    if current_rent is None: return 0
    return abs(current_rent - rent)
