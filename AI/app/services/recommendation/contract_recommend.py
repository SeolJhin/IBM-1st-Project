from datetime import date, datetime

from app.schemas.ai_request import AiRequest


def recommend_contract_rooms(req: AiRequest) -> str:
    contract_end_raw = req.get_slot("contract_end")
    building_id = _to_int(req.get_slot("building_id"))
    current_rent = _to_int(req.get_slot("rent_price"))
    raw_items = req.get_slot("items")

    candidates = _filter_candidates(raw_items, building_id, current_rent)
    if not candidates:
        return "No renewal candidates were provided from backend data."

    candidates.sort(key=lambda item: (_rent_distance(item["rent_price"], current_rent), -item["popularity"]))
    top = candidates[:3]
    day_text = _contract_day_text(contract_end_raw)

    recommendation = " / ".join(
        f"{item['name']} ({item['rent_price']} KRW, popularity {item['popularity']})"
        for item in top
    )
    return f"{day_text} Recommended top rooms: {recommendation}. Would you like to open room details?"


def _filter_candidates(
    raw_items: object,
    building_id: int | None,
    current_rent: int | None,
) -> list[dict[str, int | str]]:
    if not isinstance(raw_items, list):
        return []

    filtered: list[dict[str, int | str]] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue
        normalized = _normalize_item(item)
        if normalized is None:
            continue
        if building_id is not None and normalized["building_id"] != building_id:
            continue
        if current_rent is not None and _rent_distance(normalized["rent_price"], current_rent) > 200000:
            continue
        filtered.append(normalized)
    return filtered


def _normalize_item(item: dict) -> dict[str, int | str] | None:
    room_name = _to_text(_item_value(item, "name", "room_name", "roomName")) or "Unknown Room"
    item_building_id = _to_int(_item_value(item, "building_id", "buildingId"))
    item_rent_price = _to_int(_item_value(item, "rent_price", "rentPrice"))
    item_popularity = _to_int(_item_value(item, "popularity")) or 0

    if item_rent_price is None:
        return None

    return {
        "name": room_name,
        "building_id": item_building_id if item_building_id is not None else 0,
        "rent_price": item_rent_price,
        "popularity": item_popularity,
    }


def _item_value(item: dict, *keys: str) -> object:
    for key in keys:
        if key in item:
            return item[key]
    return None


def _to_text(value: object) -> str:
    text = str(value or "").strip()
    return text


def _contract_day_text(contract_end_raw: object) -> str:
    contract_end = _to_date(contract_end_raw)
    if contract_end is None:
        return "Contract period is close to ending."

    days_left = (contract_end - date.today()).days
    if days_left < 0:
        return f"Contract has already expired by {-days_left} day(s)."
    if days_left <= 7:
        return f"Contract expires soon (D-{days_left})."
    return f"Contract has {days_left} day(s) remaining."


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


def _rent_distance(rent: int, current_rent: int | None) -> int:
    if current_rent is None:
        return 0
    return abs(current_rent - rent)
