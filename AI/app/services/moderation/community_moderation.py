from __future__ import annotations

from typing import Any

from app.schemas.ai_request import AiRequest
from app.services.moderation.policy import detect_policy_matches


def moderate_community_content(req: AiRequest) -> tuple[str, float, dict[str, Any]]:
    content = str(req.get_slot("content") or req.prompt or "").strip()
    if not content:
        return "Content moderation skipped (empty content).", 0.7, {"action": "ALLOW", "matched": []}

    matched = detect_policy_matches(content)
    if not matched:
        return "Content moderation passed.", 0.88, {"action": "ALLOW", "matched": []}

    severity = _severity(matched)
    action = "BLOCK" if severity >= 3 else "REVIEW"
    message = "Content blocked due to policy violations." if action == "BLOCK" else "Content flagged for admin review."
    confidence = min(0.97, 0.65 + severity * 0.1)
    return message, confidence, {"action": action, "matched": matched, "severity": severity}


def _severity(matched: list[dict[str, str]]) -> int:
    if not matched:
        return 0
    unique_categories = {item["category"] for item in matched}
    return len(unique_categories)
