from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.config.settings import BASE_DIR, settings

_DEFAULT_TERMS = {
    "profanity": {"fuck", "shit", "bitch", "idiot", "ssibal", "byungsin", "gaesaekki", "jot"},
    "slander": {"fraud", "scam", "criminal", "thief", "liar", "sagikkun", "doduk", "beomjoeja", "heowisasil"},
    "political_agitation": {"vote now", "regime", "overthrow", "campaign rally", "jeonggwon tado", "tupyo dokryeo", "seondong", "jeongchi seondong"},
}

_cache_terms: dict[str, set[str]] | None = None
_cache_file: str = ""
_cache_mtime: float | None = None


def detect_policy_matches(text: str) -> list[dict[str, str]]:
    lowered = text.lower()
    terms = _load_terms()
    matched: list[dict[str, str]] = []
    matched.extend(_match_terms(lowered, terms.get("profanity", set()), "PROFANITY"))
    matched.extend(_match_terms(lowered, terms.get("slander", set()), "SLANDER"))
    matched.extend(_match_terms(lowered, terms.get("political_agitation", set()), "POLITICAL_AGITATION"))
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


def _resolve_terms_path() -> Path:
    path = Path(settings.moderation_terms_path)
    if not path.is_absolute():
        path = BASE_DIR / path
    return path.resolve()


def _load_terms() -> dict[str, set[str]]:
    global _cache_terms, _cache_file, _cache_mtime

    path = _resolve_terms_path()
    current_file = str(path)
    current_mtime: float | None = None
    if path.exists():
        try:
            current_mtime = path.stat().st_mtime
        except OSError:
            current_mtime = None

    if _cache_terms is not None and _cache_file == current_file and _cache_mtime == current_mtime:
        return _cache_terms

    loaded = _read_terms_file(path)
    _cache_terms = loaded
    _cache_file = current_file
    _cache_mtime = current_mtime
    return loaded


def _read_terms_file(path: Path) -> dict[str, set[str]]:
    if not path.exists():
        return {k: set(v) for k, v in _DEFAULT_TERMS.items()}

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {k: set(v) for k, v in _DEFAULT_TERMS.items()}

    if not isinstance(raw, dict):
        return {k: set(v) for k, v in _DEFAULT_TERMS.items()}

    terms: dict[str, set[str]] = {}
    for key, default_values in _DEFAULT_TERMS.items():
        values = raw.get(key)
        if not isinstance(values, list):
            terms[key] = set(default_values)
            continue
        normalized = {str(value).strip().lower() for value in values if str(value).strip()}
        terms[key] = normalized if normalized else set(default_values)
    return terms


def _match_terms(text: str, terms: set[str], category: str) -> list[dict[str, str]]:
    matched: list[dict[str, str]] = []
    for term in terms:
        if term in text:
            matched.append({"category": category, "term": term})
    return matched
