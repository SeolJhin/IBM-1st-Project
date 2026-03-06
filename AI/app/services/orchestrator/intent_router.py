from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.rag.retriever import retrieve_context
from app.services.rag.generator import generate_answer
from app.services.recommendation.contract_recommend import recommend_contract_rooms
from app.services.recommendation.room_recommend import recommend_rooms
from app.services.recommendation.common_space_recommend import recommend_common_space
from app.services.anomaly.contract_anomaly import detect_contract_anomaly
from app.services.document.payment_summary_doc import make_payment_summary


class IntentRouter:
    def route(self, req: AiRequest) -> AiResponse:
        intent = req.intent

        if intent in {"GENERAL_QA", "COMMUNITY_CONTENT_SEARCH"}:
            docs = retrieve_context(req)
            answer = generate_answer(req, docs)
            return AiResponse(answer=answer, confidence=0.82, metadata={"docs": len(docs)})

        if intent == "CONTRACT_RENEWAL_RECOMMEND":
            return AiResponse(answer=recommend_contract_rooms(req), confidence=0.79)

        if intent == "ROOM_AVAILABILITY_SEARCH":
            return AiResponse(answer=recommend_rooms(req), confidence=0.84)

        if intent == "COMMON_SPACE_RECOMMEND":
            return AiResponse(answer=recommend_common_space(req), confidence=0.77)

        if intent == "CONTRACT_ANOMALY_DETECTION":
            score, msg = detect_contract_anomaly(req)
            return AiResponse(answer=msg, confidence=score)

        if intent in {"PAYMENT_SUMMARY_DOCUMENT", "PAYMENT_STATUS_SUMMARY"}:
            return AiResponse(answer=make_payment_summary(req), confidence=0.86)

        if intent in {"ROOMSERVICE_STOCK_MONITOR", "COMPLAIN_PRIORITY_CLASSIFY"}:
            return AiResponse(answer="Request processed.", confidence=0.75)

        return AiResponse(answer="Unsupported intent.", confidence=0.0)
