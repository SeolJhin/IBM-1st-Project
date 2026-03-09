from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.v1.contract import CONTRACT_VERSION, INTENT_CONTRACT
from app.api.v1.dto_ai_rest import (
    AiAgentChatbotRequest,
    AiAgentRagSearchRequest,
    CommonSpaceRecommendRequest,
    CommunityContentModerationRequest,
    CommunityContentSearchRequest,
    ComplainPriorityClassifyRequest,
    ContractAnomalyDetectionRequest,
    ContractRenewalRecommendRequest,
    GeneralQaRequest,
    PaymentOrderSuggestionRequest,
    PaymentStatusSummaryRequest,
    PaymentSummaryDocumentRequest,
    RoomAvailabilitySearchRequest,
    RoomserviceStockMonitorRequest,
    VoiceChatbotRequest,
)
from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request
from app.schemas.ai_response import AiResponse
from app.services.rag.index_pipeline import get_rag_status
from app.services.rag.reindex_daemon import trigger_reindex

router = APIRouter(prefix="/api/v1/ai", tags=["ai-rest"])


@router.get("/contract")
def get_contract() -> dict[str, object]:
    return {
        "contractVersion": CONTRACT_VERSION,
        "intents": INTENT_CONTRACT,
    }


@router.post("/chat/general-qa", response_model=AiResponse, responses=ERROR_RESPONSES)
def general_qa(req: GeneralQaRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="GENERAL_QA"))


@router.post("/chat/agent-chatbot", response_model=AiResponse, responses=ERROR_RESPONSES)
def agent_chatbot(req: AiAgentChatbotRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="AI_AGENT_CHATBOT"))


@router.post("/chat/voice-assistant", response_model=AiResponse, responses=ERROR_RESPONSES)
def voice_assistant(req: VoiceChatbotRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="VOICE_CHATBOT"))


@router.post("/search/rag", response_model=AiResponse, responses=ERROR_RESPONSES)
def rag_search(req: AiAgentRagSearchRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="AI_AGENT_RAG_SEARCH"))


@router.post("/community/content-search", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_search(req: CommunityContentSearchRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMMUNITY_CONTENT_SEARCH"))


@router.post("/community/content-moderation", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_moderation(req: CommunityContentModerationRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMMUNITY_CONTENT_MODERATION"))


@router.post("/contracts/renewal-recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_renewal_recommendations(req: ContractRenewalRecommendRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="CONTRACT_RENEWAL_RECOMMEND"))


@router.post("/contracts/anomaly-detections", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_anomaly_detections(req: ContractAnomalyDetectionRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="CONTRACT_ANOMALY_DETECTION"))


@router.post("/rooms/availability-searches", response_model=AiResponse, responses=ERROR_RESPONSES)
def room_availability_searches(req: RoomAvailabilitySearchRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="ROOM_AVAILABILITY_SEARCH"))


@router.post("/common-spaces/recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def common_space_recommendations(req: CommonSpaceRecommendRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMMON_SPACE_RECOMMEND"))


@router.post("/payments/summary-documents", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_summary_documents(req: PaymentSummaryDocumentRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="PAYMENT_SUMMARY_DOCUMENT"))


@router.post("/payments/status-summaries", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_status_summaries(req: PaymentStatusSummaryRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="PAYMENT_STATUS_SUMMARY"))


@router.post("/payments/order-suggestions", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_suggestions(req: PaymentOrderSuggestionRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="PAYMENT_ORDER_SUGGESTION"))


@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock_monitoring(req: RoomserviceStockMonitorRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="ROOMSERVICE_STOCK_MONITOR"))


@router.post("/operations/complaint-priority-classification", response_model=AiResponse, responses=ERROR_RESPONSES)
def complaint_priority_classification(req: ComplainPriorityClassifyRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMPLAIN_PRIORITY_CLASSIFY"))


@router.get("/admin/rag/status")
def rag_index_status() -> dict[str, object]:
    return get_rag_status()


@router.post("/admin/rag/reindex")
def rag_reindex() -> dict[str, object]:
    return trigger_reindex(force=True)


@router.post("/admin/rag/reindex-if-changed")
def rag_reindex_if_changed() -> dict[str, object]:
    return trigger_reindex(force=False)
