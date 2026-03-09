from app.integrations.milvus_client import search_vectors
from app.schemas.ai_request import AiRequest
from app.services.rag.reranker import rerank

FAQ_CONTEXT: dict[str, str] = {
    "tour": "Tour reservation is available after selecting a room and entering the visit date.",
    "reservation": "Tour reservation is available after selecting a room and entering the visit date.",
    "move-in": "Move-in process is application review, contract confirmation, payment, and move-in scheduling.",
    "contract": "Contract support is available from the contract page with renewal and policy guidance.",
    "payment": "Payment details can be checked by billing month and payment status in the payment menu.",
    "service": "Uniplace service guide includes room search, contract flow, payment, and support options.",
    "default": "General service guide is available for reservation, contract, and payment topics.",
}

COMMUNITY_CONTEXT: dict[str, str] = {
    "popular": "Popular posts are ranked by recent view and engagement signals.",
    "notice": "Move-in and resident notices are pinned in the announcement board.",
    "noise": "Noise-related posts include reporting flow, response status, and resident tips.",
    "review": "Resident reviews are grouped by building with recent highlights.",
    "default": "Top community updates include notices, reviews, and resident Q&A posts.",
}


def retrieve_context(req: AiRequest) -> list[str]:
    query = _build_query(req)
    candidates: list[str] = []
    candidates.extend(_extract_slot_context(req))
    candidates.extend(search_vectors(req))
    candidates.extend(_lookup_static_context(req, query))

    unique_docs: list[str] = []
    for doc in candidates:
        normalized = str(doc).strip()
        if normalized and normalized not in unique_docs:
            unique_docs.append(normalized)

    return rerank(unique_docs, query=query, limit=3)


def _extract_slot_context(req: AiRequest) -> list[str]:
    raw_items = req.get_slot("items")
    if not isinstance(raw_items, list):
        return []

    docs: list[str] = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue

        text = _item_text(item)
        if text and text not in docs:
            docs.append(text)
    return docs


def _item_text(item: dict) -> str:
    for key in ("content", "text", "chunk", "summary", "answer", "message"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            title = item.get("title")
            if isinstance(title, str) and title.strip():
                return f"{title.strip()}: {value.strip()}"
            return value.strip()

    fallbacks: list[str] = []
    for key in (
        "prod_nm",
        "name",
        "payment_st",
        "target_type",
        "comp_title",
        "comp_ctnt",
        "board_title",
        "board_ctnt",
        "space_name",
    ):
        value = item.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            fallbacks.append(text)

    if fallbacks:
        return " | ".join(fallbacks)
    return ""


def _build_query(req: AiRequest) -> str:
    prompt = req.prompt or ""
    topic = str(req.get_slot("topic") or "")
    keyword = str(req.get_slot("keyword") or "")
    return " ".join(part for part in (prompt, topic, keyword) if part).strip()


def _lookup_static_context(req: AiRequest, query: str) -> list[str]:
    source = _context_source(req.intent)
    if not source:
        return []

    lowered = query.lower()
    matched: list[str] = []
    for key, context in source.items():
        if key == "default":
            continue
        if key in lowered:
            matched.append(context)

    if matched:
        return matched

    fallback = source.get("default")
    return [fallback] if fallback else []


def _context_source(intent: str) -> dict[str, str]:
    if intent == "GENERAL_QA":
        return FAQ_CONTEXT
    if intent == "COMMUNITY_CONTENT_SEARCH":
        return COMMUNITY_CONTEXT
    return {}
