from app.schemas.ai_request import AiRequest
from datetime import datetime


def detect_contract_anomaly(req: AiRequest) -> tuple[float, str]:
    score = _to_float(req.get_slot("pattern_score")) or 0.35
    contract_count = _to_int(req.get_slot("contract_count")) or 0
    contract_st = str(req.get_slot("contract_st") or "").upper()
    created_hour = _extract_hour(req.get_slot("created_at"))

    score += _count_boost(contract_count)
    if contract_count >= 5 and contract_st in {"REQUESTED", "PENDING", "CREATED"}:
        score += 0.1
    if created_hour is not None and 0 <= created_hour <= 5:
        score += 0.1

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
