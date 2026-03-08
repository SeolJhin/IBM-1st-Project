from datetime import datetime

from app.schemas.ai_request import AiRequest

HIGH_PRIORITY_WORDS = {"urgent", "asap", "immediately", "right now", "critical", "emergency", "help"}
MEDIUM_PRIORITY_WORDS = {"fast", "quick", "soon", "problem", "issue", "noise", "contract"}


def classify_complain_priority(req: AiRequest) -> tuple[int, str]:
    title = str(req.get_slot("comp_title") or "")
    content = str(req.get_slot("comp_ctnt") or "")
    keyword = str(req.get_slot("keyword") or "")
    override_score = _to_float(req.get_slot("priority_score"))

    if override_score is not None:
        priority = _priority_from_override(override_score)
    else:
        priority = _priority_from_text(" ".join([title, content, keyword]))

    stars = "*" * priority
    created_at = datetime.now().date().isoformat()
    message = (
        f"id | type | title | status | date | priority\n"
        f"1 | complain | {title or 'N/A'} | requested | {created_at} | {stars}"
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
