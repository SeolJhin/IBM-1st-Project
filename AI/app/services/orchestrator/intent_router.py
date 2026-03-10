from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.rag.retriever import retrieve_context
from app.services.rag.generator import generate_answer
from app.services.recommendation.contract_recommend import recommend_contract_rooms
from app.services.recommendation.room_recommend import recommend_rooms
from app.services.recommendation.common_space_recommend import recommend_common_space
from app.services.anomaly.contract_anomaly import detect_contract_anomaly
from app.services.classify.complain_priority import classify_complain_priority
from app.services.monitor.roomservice_stock import monitor_roomservice_stock
from app.services.document.payment_summary_doc import make_payment_summary
from app.services.document.payment_order_suggestion import suggest_order_from_payment
from app.services.moderation.community_moderation import moderate_community_content
from app.services.voice.voice_chatbot import run_voice_chatbot


class IntentRouter:
    def route(self, req: AiRequest) -> AiResponse:
        intent = req.intent

        if intent in {"GENERAL_QA", "COMMUNITY_CONTENT_SEARCH"}:
            blocked = _moderation_block_response(req)
            if blocked is not None:
                return blocked
            docs = retrieve_context(req)
            answer = generate_answer(req, docs)
            confidence = _confidence_from_docs(docs)
            return AiResponse(answer=answer, confidence=confidence, metadata={"docs": len(docs)})

        if intent in {"AI_AGENT_CHATBOT", "AI_AGENT_RAG_SEARCH"}:
            blocked = _moderation_block_response(req)
            if blocked is not None:
                return blocked
            docs = retrieve_context(req)
            answer = generate_answer(req, docs)
            confidence = _confidence_from_docs(docs)
            return AiResponse(answer=answer, confidence=confidence, metadata={"docs": len(docs), "agent": "chatbot"})

        if intent == "VOICE_CHATBOT":
            answer, metadata = run_voice_chatbot(req)
            confidence = _confidence_from_result(answer, base=0.82)
            return AiResponse(answer=answer, confidence=confidence, metadata=metadata)

        if intent == "CONTRACT_RENEWAL_RECOMMEND":
            answer = recommend_contract_rooms(req)
            return AiResponse(answer=answer, confidence=_confidence_from_result(answer, base=0.8))

        if intent == "ROOM_AVAILABILITY_SEARCH":
            answer = recommend_rooms(req)
            return AiResponse(answer=answer, confidence=_confidence_from_result(answer, base=0.84))

        if intent == "COMMON_SPACE_RECOMMEND":
            answer = recommend_common_space(req)
            return AiResponse(answer=answer, confidence=_confidence_from_result(answer, base=0.78))

        if intent == "CONTRACT_ANOMALY_DETECTION":
            score, msg, metadata = detect_contract_anomaly(req)
            return AiResponse(answer=msg, confidence=score, metadata=metadata)

        if intent in {"PAYMENT_SUMMARY_DOCUMENT", "PAYMENT_STATUS_SUMMARY"}:
            answer, metadata = make_payment_summary(req)
            return AiResponse(answer=answer, confidence=_confidence_from_result(answer, base=0.85), metadata=metadata)

        if intent == "PAYMENT_ORDER_SUGGESTION":
            answer, metadata = suggest_order_from_payment(req)
            return AiResponse(answer=answer, confidence=_confidence_from_result(answer, base=0.83), metadata=metadata)

        if intent == "COMPLAIN_PRIORITY_CLASSIFY":
            priority, msg = classify_complain_priority(req)
            confidence = min(0.95, 0.45 + priority * 0.15)
            return AiResponse(answer=msg, confidence=confidence, metadata={"priority": priority})

        if intent == "ROOMSERVICE_STOCK_MONITOR":
            score, msg, metadata = monitor_roomservice_stock(req)
            return AiResponse(answer=msg, confidence=score, metadata=metadata)

        if intent == "COMMUNITY_CONTENT_MODERATION":
            msg, score, metadata = moderate_community_content(req)
            return AiResponse(answer=msg, confidence=score, metadata=metadata)

        return AiResponse(answer="Unsupported intent.", confidence=0.0)


def _confidence_from_docs(docs: list[str]) -> float:
    return min(0.9, 0.6 + 0.1 * len(docs))


def _confidence_from_result(answer: str, base: float) -> float:
    lowered = answer.lower()
    if "no " in lowered or "not found" in lowered or "n/a" in lowered:
        return max(0.5, base - 0.25)
    if "unknown" in lowered:
        return max(0.55, base - 0.2)
    return base


def _moderation_block_response(req: AiRequest) -> AiResponse | None:
    text = str(req.prompt or req.get_slot("content") or req.get_slot("keyword") or "").strip()
    if not text:
        return None
    moderation_req = AiRequest(intent="COMMUNITY_CONTENT_MODERATION", user_id=req.user_id, prompt=text, slots={"content": text})
    message, confidence, metadata = moderate_community_content(moderation_req)
    if metadata.get("action") == "BLOCK":
        return AiResponse(answer=message, confidence=confidence, metadata={"moderation": metadata, "docs": 0})
    return None
