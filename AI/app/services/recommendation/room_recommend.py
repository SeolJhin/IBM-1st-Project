from app.schemas.ai_request import AiRequest


def recommend_rooms(req: AiRequest) -> str:
    check_in = str(req.get_slot("check_in_date") or "")
    check_out = str(req.get_slot("check_out_date") or "")
    building_nm = str(req.get_slot("building_nm") or req.get_slot("buildingNm") or "").strip()
    building_addr = str(req.get_slot("building_addr") or req.get_slot("buildingAddr") or "").strip().lower()
    room_type = str(req.get_slot("room_type") or req.get_slot("roomType") or "").strip().upper()
    max_rent = _to_int(req.get_slot("max_rent_price") or req.get_slot("rent_price") or req.get_slot("rentPrice"))
    min_capacity = _to_int(req.get_slot("room_capacity") or req.get_slot("roomCapacity"))
    pet_required = _to_yes_no(req.get_slot("pet_allowed_yn") or req.get_slot("petAllowedYn"))
    option_text = str(req.get_slot("option") or "").lower()
    parking_required = "parking" in option_text or "park" in option_text or "주차" in option_text

    source_items = _load_items(req)
    if not source_items:
        return "죄송합니다. 현재 조회 가능한 방 정보가 없습니다. 잠시 후 다시 시도해주세요."

    filtered = []
    for room in source_items:
        item_nm   = str(_item_value(room, "building_nm", "buildingNm") or "").lower()
        item_addr = str(_item_value(room, "building_addr", "buildingAddr") or "").lower()
        item_room_type = _normalize_room_type(_item_value(room, "room_type", "roomType"))
        item_rent = _to_int(_item_value(room, "rent_price", "rentPrice"))
        item_capacity = _to_int(_item_value(room, "room_capacity", "roomCapacity"))
        item_pet = _to_yes_no(_item_value(room, "pet_allowed_yn", "petAllowedYn"))
        item_parking = _to_bool(_item_value(room, "parking"))

        if building_nm and building_nm.lower() not in item_nm:
            continue
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
        cond_parts = []
        if pet_required == "Y": cond_parts.append("반려동물 허용")
        if max_rent:            cond_parts.append(f"월세 {max_rent:,}원 이하")
        if building_nm:         cond_parts.append(f"{building_nm}")
        cond_text = ", ".join(cond_parts) if cond_parts else "해당 조건"
        return f"죄송합니다. {cond_text}에 맞는 방을 찾지 못했습니다. 조건을 조금 완화해서 다시 검색해 보시겠어요?"

    filtered.sort(key=lambda r: (_rent_distance(r["_rent"], max_rent), -r["_popularity"]))
    top = filtered[:5]

    cond_parts = []
    if pet_required == "Y": cond_parts.append("반려동물 허용")
    if max_rent:            cond_parts.append(f"월세 {max_rent:,}원 이하")
    if building_nm:         cond_parts.append(f"{building_nm}")
    if min_capacity:        cond_parts.append(f"{min_capacity}인 이상")
    cond_text = ", ".join(cond_parts) if cond_parts else "입주 가능"

    parts = [f"[{cond_text}] 조건에 맞는 방이 총 {len(filtered)}개 있습니다. 추천 방 목록:"]
    for i, room in enumerate(top, 1):
        b_nm   = _item_value(room, "building_nm") or "알 수 없음"
        room_no = _item_value(room, "room_no")
        r_no   = f" {room_no}호" if room_no else ""
        rent   = room["_rent"]
        cap    = room["_capacity"]
        pet    = "가능" if _to_yes_no(_item_value(room, "pet_allowed_yn")) == "Y" else "불가"
        parking = "가능" if room["_parking"] else "불가"
        rtype  = _item_value(room, "room_type") or ""
        parts.append(
            f"{i}. {b_nm}{r_no} | {rtype} | 월세 {rent:,}원 | {cap}인 | 반려동물 {pet} | 주차 {parking}"
        )

    return "\n".join(parts)

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

    return "\n".join(parts)


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