from app.schemas.ai_request import AiRequest

ROOM_CANDIDATES = [
    {
        "name": "Gangnam Sky House",
        "building_addr": "Gangnam",
        "rent_price": 950000,
        "room_capacity": 2,
        "room_type": "DOUBLE",
        "parking": True,
        "pet_allowed_yn": "N",
        "popularity": 96,
    },
    {
        "name": "Gangnam Central Stay",
        "building_addr": "Gangnam",
        "rent_price": 890000,
        "room_capacity": 2,
        "room_type": "DOUBLE",
        "parking": False,
        "pet_allowed_yn": "Y",
        "popularity": 89,
    },
    {
        "name": "Seocho Green House",
        "building_addr": "Seocho",
        "rent_price": 780000,
        "room_capacity": 1,
        "room_type": "SINGLE",
        "parking": True,
        "pet_allowed_yn": "Y",
        "popularity": 80,
    },
    {
        "name": "Gangnam River View",
        "building_addr": "Gangnam",
        "rent_price": 1000000,
        "room_capacity": 2,
        "room_type": "DOUBLE",
        "parking": True,
        "pet_allowed_yn": "Y",
        "popularity": 93,
    },
    {
        "name": "Songpa Smart Living",
        "building_addr": "Songpa",
        "rent_price": 830000,
        "room_capacity": 2,
        "room_type": "DOUBLE",
        "parking": True,
        "pet_allowed_yn": "N",
        "popularity": 85,
    },
]


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

    filtered = []
    for room in ROOM_CANDIDATES:
        if building_addr and building_addr not in room["building_addr"].lower():
            continue
        if room_type and room_type != room["room_type"]:
            continue
        if max_rent is not None and room["rent_price"] > max_rent:
            continue
        if min_capacity is not None and room["room_capacity"] < min_capacity:
            continue
        if pet_required == "Y" and room["pet_allowed_yn"] != "Y":
            continue
        if parking_required and not room["parking"]:
            continue
        filtered.append(room)

    if not filtered:
        return "No matched rooms were found. Please relax one or more conditions."

    filtered.sort(key=lambda room: (_rent_distance(room["rent_price"], max_rent), -room["popularity"]))
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
        f"{item['name']} | {item['rent_price']} KRW | {item['room_capacity']}p | parking {'Y' if item['parking'] else 'N'}"
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
