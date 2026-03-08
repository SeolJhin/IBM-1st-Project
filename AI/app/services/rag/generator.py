from app.schemas.ai_request import AiRequest


def generate_answer(req: AiRequest, docs: list[str]) -> str:
    if req.intent == "COMMUNITY_CONTENT_SEARCH":
        return _community_answer(req, docs)
    return _general_qa_answer(req, docs)


def _general_qa_answer(req: AiRequest, docs: list[str]) -> str:
    question = (req.prompt or "").strip()
    lowered = question.lower()

    if "tour" in lowered and ("reserve" in lowered or "book" in lowered):
        return "Tour reservation can be completed by selecting a room and entering your preferred visit date."

    if "move-in" in lowered or "move in" in lowered:
        return "Move-in steps are application review, contract confirmation, payment, and move-in scheduling."

    if docs:
        return f"Based on available guidance: {docs[0]}"

    if question:
        return f"Guidance for question: {question}"
    return "General guidance is available. Please provide more details."


def _community_answer(req: AiRequest, docs: list[str]) -> str:
    keyword = str(req.get_slot("keyword") or req.get_slot("topic") or "").strip()
    if docs:
        top = docs[:3]
        joined = " | ".join(top)
        if keyword:
            return f"Top community results for '{keyword}': {joined}"
        return f"Top community results: {joined}"

    if keyword:
        return f"No recent community results were found for '{keyword}'."
    return "No recent community results were found."
