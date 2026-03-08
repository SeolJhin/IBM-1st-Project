from app.schemas.ai_request import AiRequest


def detect_contract_anomaly(req: AiRequest) -> tuple[float, str]:
    score = float(req.get_slot("pattern_score") or 0.35)
    if score >= 0.8:
        return score, "Anomalous contract request pattern detected. Admin review required."
    return score, "No strong anomaly detected."
