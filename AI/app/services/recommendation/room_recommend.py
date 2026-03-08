from app.schemas.ai_request import AiRequest


def recommend_rooms(req: AiRequest) -> str:
    check_in = str(req.get_slot("check_in_date") or "")
    check_out = str(req.get_slot("check_out_date") or "")
    building_addr = str(req.get_slot("building_addr") or "").strip().lower()
    room_type = str(req.get_slot("room_type") or "").strip().upper()
    max_rent = _to_int(req.get_slot("rent_price"))
    min_capacity = _to_int(req.get_slot("room_capacity"))
    pet_required = _to_yes_no(req.get_slot("pet_allowed_yn"))
    option_text = str(req.get_slot("option") or "").lower()
    parking_required = "parking" in option_text or "park" in option_text

    source_items = _load_items(req)
    if not source_items:
        return "No room inventory data was provided for recommendation."

    filtered = []
    for room in source_items:
        item_addr = str(_item_value(room, "building_addr", "buildingAddr") or "").lower()
        item_room_type = _normalize_room_type(_item_value(room, "room_type", "roomType"))
        item_rent = _to_int(_item_value(room, "rent_price", "rentPrice"))
        item_capacity = _to_int(_item_value(room, "room_capacity", "roomCapacity"))
        item_pet = _to_yes_no(_item_value(room, "pet_allowed_yn", "petAllowedYn"))
        item_parking = _to_bool(_item_value(room, "parking"))
        if building_addr and building_addr not in item_addr:
            continue
        if room_type and room_type != item_room_type:
            continue
        if max_rent is not None and item_rent is not None and item_rent > max_rent:
            continue
        if min_capacity is not None and item_capacity is not None and item_capacity < min_capacity:
            continue
        if pet_required == "Y" and item_pet != "Y":
            continue
        if parking_required and not item_parking:
            continue
        enriched = dict(room)
        enriched["_rent"] = item_rent if item_rent is not None else 0
        enriched["_popularity"] = _to_int(_item_value(room, "popularity")) or 0
        enriched["_capacity"] = item_capacity if item_capacity is not None else 0
        enriched["_parking"] = item_parking
        filtered.append(enriched)

    if not filtered:
        return "No matched rooms were found. Please relax one or more conditions."

    filtered.sort(key=lambda room: (_rent_distance(room["_rent"], max_rent), -room["_popularity"]))
    top = filtered[:3]

    terms = []
    if check_in and check_out:
        terms.append(f"stay {check_in} to {check_out}")
    if building_addr:
        terms.append(f"area {building_addr}")
    if min_capacity is not None:
        terms.append(f"capacity {min_capacity}+")
    if max_rent is not None:
        terms.append(f"budget <= {max_rent}")
    term_text = ", ".join(terms) if terms else "your requested conditions"

    room_text = " / ".join(
        f"{_item_name(item)} | {item['_rent']} KRW | {item['_capacity']}p | parking {'Y' if item['_parking'] else 'N'}"
        for item in top
    )
    return f"Found {len(filtered)} matched rooms for {term_text}. Top picks: {room_text}. Tour booking is available now."


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_yes_no(value: object) -> str:
    text = str(value or "").strip().upper()
    if text in {"Y", "YES", "TRUE"}:
        return "Y"
    if text in {"N", "NO", "FALSE"}:
        return "N"
    return ""


def _rent_distance(rent: int, max_rent: int | None) -> int:
    if max_rent is None:
        return 0
    return abs(max_rent - rent)


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


def _item_name(item: dict) -> str:
    name = _item_value(item, "name", "building_nm", "buildingNm")
    return str(name) if name else "Unknown Room"


def _normalize_room_type(value: object) -> str:
    text = str(value or "").strip().upper()
    if text in {"ONE_ROOM", "SINGLE", "ONE"}:
        return "SINGLE"
    if text in {"TWO_ROOM", "DOUBLE", "TWO"}:
        return "DOUBLE"
    if text in {"THREE_ROOM", "TRIPLE", "THREE"}:
        return "TRIPLE"
    return text


def _to_bool(value: object) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value or "").strip().lower()
    return text in {"y", "yes", "true", "1"}
