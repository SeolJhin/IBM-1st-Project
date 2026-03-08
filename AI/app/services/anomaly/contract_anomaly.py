from app.schemas.ai_request import AiRequest
from datetime import datetime


def detect_contract_anomaly(req: AiRequest) -> tuple[float, str]:
    items = _load_items(req.get_slot("items"))
    score = _to_float(req.get_slot("pattern_score")) or 0.35
    contract_count = _to_int(req.get_slot("contract_count"))
    if contract_count is None:
        contract_count = len(items)

    contract_st = str(req.get_slot("contract_st") or "").upper()
    if not contract_st and items:
        contract_st = str(items[0].get("contract_st") or "").upper()

    created_at = req.get_slot("created_at")
    if created_at is None and items:
        created_at = items[0].get("created_at")
    created_hour = _extract_hour(created_at)

    score += _count_boost(contract_count)
    if contract_count >= 5 and contract_st in {"REQUESTED", "PENDING", "CREATED"}:
        score += 0.1
    if created_hour is not None and 0 <= created_hour <= 5:
        score += 0.1
    score += _burst_boost(items)

    score = min(max(score, 0.0), 1.0)
    if score >= 0.8:
        return score, "Anomalous contract request pattern detected. Admin review required."
    if score >= 0.6:
        return score, "Suspicious contract activity detected. Additional monitoring is recommended."
    return score, "No strong anomaly detected."


def _count_boost(contract_count: int) -> float:
    if contract_count >= 10:
        return 0.35
    if contract_count >= 5:
        return 0.2
    if contract_count >= 3:
        return 0.1
    return 0.0


def _to_int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _extract_hour(value: object) -> int | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        return dt.hour
    except ValueError:
        return None


def _load_items(value: object) -> list[dict]:
    if not isinstance(value, list):
        return []

    normalized: list[dict] = []
    for item in value:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "contract_st": str(_item_value(item, "contract_st", "contractSt") or "").upper(),
                "created_at": _item_value(item, "created_at", "createdAt"),
            }
        )
    return normalized


def _item_value(item: dict, *keys: str) -> object:
    for key in keys:
        if key in item:
            return item[key]
    return None


def _burst_boost(items: list[dict]) -> float:
    if not items:
        return 0.0

    now = datetime.now()
    within_24h = 0
    within_1h = 0
    requested_like = 0

    for item in items:
        status = str(item.get("contract_st") or "").upper()
        if status in {"REQUESTED", "APPROVED", "PENDING", "CREATED"}:
            requested_like += 1

        created_at = _to_datetime(item.get("created_at"))
        if created_at is None:
            continue
        delta = now - created_at
        if delta.total_seconds() <= 3600:
            within_1h += 1
        if delta.total_seconds() <= 86400:
            within_24h += 1

    total = len(items)
    boost = 0.0
    if within_24h >= 3:
        boost += 0.1
    if within_1h >= 2:
        boost += 0.08
    if total > 0 and requested_like / total >= 0.7:
        boost += 0.05
    return boost


def _to_datetime(value: object) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00").replace(" ", "T"))
    except ValueError:
        return None
