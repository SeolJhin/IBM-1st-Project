from __future__ import annotations

from typing import Any

PROFANITY_WORDS = {
    "fuck",
    "shit",
    "bitch",
    "idiot",
    "ssibal",
    "byungsin",
    "gaesaekki",
    "jot",
}
SLANDER_WORDS = {
    "fraud",
    "scam",
    "criminal",
    "thief",
    "liar",
    "sagikkun",
    "doduk",
    "beomjoeja",
    "heowisasil",
}
POLITICAL_AGITATION_WORDS = {
    "vote now",
    "regime",
    "overthrow",
    "campaign rally",
    "jeonggwon tado",
    "tupyo dokryeo",
    "seondong",
    "jeongchi seondong",
}


def detect_policy_matches(text: str) -> list[dict[str, str]]:
    lowered = text.lower()
    matched: list[dict[str, str]] = []
    matched.extend(_match_terms(lowered, PROFANITY_WORDS, "PROFANITY"))
    matched.extend(_match_terms(lowered, SLANDER_WORDS, "SLANDER"))
    matched.extend(_match_terms(lowered, POLITICAL_AGITATION_WORDS, "POLITICAL_AGITATION"))
    return matched


def should_block_text(text: str) -> tuple[bool, list[dict[str, str]]]:
    matched = detect_policy_matches(text)
    categories = {item["category"] for item in matched}
    return len(categories) >= 2, matched


def item_policy_text(item: dict[str, Any]) -> str:
    chunks: list[str] = []
    for key in ("title", "content", "text", "chunk", "summary", "answer", "message", "board_title", "board_ctnt"):
        value = item.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            chunks.append(text)
    return " ".join(chunks).strip()


def _match_terms(text: str, terms: set[str], category: str) -> list[dict[str, str]]:
    matched: list[dict[str, str]] = []
    for term in terms:
        if term in text:
            matched.append({"category": category, "term": term})
    return matched
