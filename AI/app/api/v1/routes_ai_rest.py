from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.api.v1.dto_ai_rest import (
    CommonSpaceRecommendRequest,
    CommunityContentSearchRequest,
    ComplainPriorityClassifyRequest,
    ContractAnomalyDetectionRequest,
    ContractRenewalRecommendRequest,
    GeneralQaRequest,
    PaymentStatusSummaryRequest,
    PaymentSummaryDocumentRequest,
    RoomAvailabilitySearchRequest,
    RoomserviceStockMonitorRequest,
)
from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request
from app.schemas.ai_response import AiResponse

router = APIRouter(prefix="/api/v1/ai", tags=["ai-rest"])


@router.post("/chat/general-qa", response_model=AiResponse, responses=ERROR_RESPONSES)
def general_qa(req: GeneralQaRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="GENERAL_QA"))


@router.post("/community/content-search", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_search(req: CommunityContentSearchRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMMUNITY_CONTENT_SEARCH"))


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


@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock_monitoring(req: RoomserviceStockMonitorRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="ROOMSERVICE_STOCK_MONITOR"))


@router.post("/operations/complaint-priority-classification", response_model=AiResponse, responses=ERROR_RESPONSES)
def complaint_priority_classification(req: ComplainPriorityClassifyRequest) -> AiResponse | JSONResponse:
    return execute_ai_request(req.to_ai_request(intent="COMPLAIN_PRIORITY_CLASSIFY"))
