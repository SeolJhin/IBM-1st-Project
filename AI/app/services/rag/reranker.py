import re


def rerank(docs: list[str], query: str = "", limit: int = 3) -> list[str]:
    if not docs:
        return []

    tokens = [t for t in re.split(r"[^a-z0-9]+", query.lower()) if t]
    scored_docs = []
    for index, doc in enumerate(docs):
        score = _score(doc, tokens)
        scored_docs.append((score, index, doc))

    scored_docs.sort(key=lambda item: (-item[0], item[1]))
    ranked = [item[2] for item in scored_docs]
    return ranked[:limit] if limit > 0 else ranked


def _score(doc: str, tokens: list[str]) -> int:
    lowered = doc.lower()
    if not tokens:
        return 0
    return sum(1 for token in tokens if token in lowered)
