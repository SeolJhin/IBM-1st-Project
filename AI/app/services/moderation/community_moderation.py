from __future__ import annotations

from typing import Any

from app.schemas.ai_request import AiRequest

PROFANITY_WORDS = {"fuck", "shit", "bitch", "idiot"}
SLANDER_WORDS = {"fraud", "scam", "criminal", "thief", "liar"}
POLITICAL_AGITATION_WORDS = {"vote now", "regime", "overthrow", "campaign rally"}


def moderate_community_content(req: AiRequest) -> tuple[str, float, dict[str, Any]]:
    content = str(req.get_slot("content") or req.prompt or "").strip()
    if not content:
        return "No content provided for moderation.", 0.4, {"action": "REVIEW", "matched": []}

    lowered = content.lower()
    matched = _collect_matches(lowered)
    if not matched:
        return "Content moderation passed.", 0.88, {"action": "ALLOW", "matched": []}

    severity = _severity(matched)
    action = "BLOCK" if severity >= 3 else "REVIEW"
    message = "Content blocked due to policy violations." if action == "BLOCK" else "Content flagged for admin review."
    confidence = min(0.97, 0.65 + severity * 0.1)
    return message, confidence, {"action": action, "matched": matched, "severity": severity}


def _collect_matches(text: str) -> list[dict[str, str]]:
    matched: list[dict[str, str]] = []
    for word in PROFANITY_WORDS:
        if word in text:
            matched.append({"category": "PROFANITY", "term": word})
    for word in SLANDER_WORDS:
        if word in text:
            matched.append({"category": "SLANDER", "term": word})
    for word in POLITICAL_AGITATION_WORDS:
        if word in text:
            matched.append({"category": "POLITICAL_AGITATION", "term": word})
    return matched


def _severity(matched: list[dict[str, str]]) -> int:
    if not matched:
        return 0
    unique_categories = {item["category"] for item in matched}
    return len(unique_categories)
