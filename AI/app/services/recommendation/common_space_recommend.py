from app.schemas.ai_request import AiRequest

COMMON_SPACE_SLOTS = [
    {
        "space_id": 101,
        "space_name": "Meeting Room A",
        "building_id": 1,
        "start_at": "2026-03-11T19:00:00",
        "end_at": "2026-03-11T20:00:00",
        "score": 95,
    },
    {
        "space_id": 102,
        "space_name": "Study Room B",
        "building_id": 1,
        "start_at": "2026-03-12T18:00:00",
        "end_at": "2026-03-12T19:00:00",
        "score": 90,
    },
    {
        "space_id": 201,
        "space_name": "Fitness Room",
        "building_id": 2,
        "start_at": "2026-03-11T20:00:00",
        "end_at": "2026-03-11T21:00:00",
        "score": 84,
    },
    {
        "space_id": 301,
        "space_name": "Meeting Room C",
        "building_id": 3,
        "start_at": "2026-03-13T19:00:00",
        "end_at": "2026-03-13T20:00:00",
        "score": 88,
    },
]


def recommend_common_space(req: AiRequest) -> str:
    preferred_space_id = _to_int(req.get_slot("space_id"))
    building_id = _to_int(req.get_slot("building_id"))
    usage_pattern = str(req.get_slot("usage_pattern") or "").lower()
    preferred_start = _extract_hour(req.get_slot("sr_start_at"))

    filtered = []
    for slot in COMMON_SPACE_SLOTS:
        if preferred_space_id is not None and slot["space_id"] != preferred_space_id:
            continue
        if building_id is not None and slot["building_id"] != building_id:
            continue
        if _is_time_mismatch(slot["start_at"], preferred_start, usage_pattern):
            continue
        filtered.append(slot)

    if not filtered:
        return "No suitable common-space slot was found. Please try a wider time range."

    filtered.sort(key=lambda item: -item["score"])
    top = filtered[:2]
    primary = top[0]

    detail = (
        f"{primary['space_name']} ({primary['start_at']} to {primary['end_at']})"
        f" in building {primary['building_id']} is available."
    )

    if len(top) > 1:
        secondary = top[1]
        detail += (
            f" Alternative: {secondary['space_name']} "
            f"({secondary['start_at']} to {secondary['end_at']})."
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
