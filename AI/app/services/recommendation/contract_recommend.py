from datetime import date, datetime

from app.schemas.ai_request import AiRequest

RENEWAL_CANDIDATES = [
    {"name": "Gangnam River View", "building_id": 1, "rent_price": 1000000, "popularity": 93},
    {"name": "Gangnam Sky House", "building_id": 1, "rent_price": 950000, "popularity": 96},
    {"name": "Gangnam Central Stay", "building_id": 1, "rent_price": 890000, "popularity": 89},
    {"name": "Songpa Smart Living", "building_id": 2, "rent_price": 830000, "popularity": 85},
    {"name": "Seocho Green House", "building_id": 3, "rent_price": 780000, "popularity": 80},
]


def recommend_contract_rooms(req: AiRequest) -> str:
    contract_end_raw = req.get_slot("contract_end")
    building_id = _to_int(req.get_slot("building_id"))
    current_rent = _to_int(req.get_slot("rent_price"))

    candidates = _filter_candidates(building_id, current_rent)
    if not candidates:
        return "No renewal candidates were found. Please check building and price conditions."

    candidates.sort(key=lambda item: (_rent_distance(item["rent_price"], current_rent), -item["popularity"]))
    top = candidates[:3]
    day_text = _contract_day_text(contract_end_raw)

    recommendation = " / ".join(
        f"{item['name']} ({item['rent_price']} KRW, popularity {item['popularity']})"
        for item in top
    )
    return f"{day_text} Recommended top rooms: {recommendation}. Would you like to open room details?"


def _filter_candidates(building_id: int | None, current_rent: int | None) -> list[dict[str, int | str]]:
    filtered: list[dict[str, int | str]] = []
    for item in RENEWAL_CANDIDATES:
        if building_id is not None and item["building_id"] != building_id:
            continue
        if current_rent is not None and _rent_distance(item["rent_price"], current_rent) > 150000:
            continue
        filtered.append(item)
    return filtered


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
