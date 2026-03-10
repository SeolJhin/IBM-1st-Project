"""
app/api/v1/routes_ai.py
Spring → FastAPI 텍스트 AI 엔드포인트
voice STT/TTS는 routes_ai_rest.py 에서만 처리
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request, parse_ai_request
from app.schemas.ai_response import AiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/execute", response_model=AiResponse, responses=ERROR_RESPONSES)
def execute(payload: Dict[str, Any] = Body(...)):
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/chat/general-qa", response_model=AiResponse, responses=ERROR_RESPONSES)
def general_qa(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "GENERAL_QA")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/chat/agent-chatbot", response_model=AiResponse, responses=ERROR_RESPONSES)
def agent_chatbot(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "GENERAL_QA")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/chat/voice-assistant", response_model=AiResponse, responses=ERROR_RESPONSES)
def voice_assistant(payload: Dict[str, Any] = Body(...)):
    if not payload.get("prompt"):
        slots = payload.get("slots") or {}
        payload["prompt"] = slots.get("transcribed_text") or payload.get("transcribed_text", "")
    payload.setdefault("intent", "GENERAL_QA")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/search/rag", response_model=AiResponse, responses=ERROR_RESPONSES)
def rag_search(payload: Dict[str, Any] = Body(...)):
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/community/content-search", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_search(payload: Dict[str, Any] = Body(...)):
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/community/content-moderation", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_moderation(payload: Dict[str, Any] = Body(...)):
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/contracts/renewal-recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_renewal(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "CONTRACT_RENEWAL_RECOMMEND")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/contracts/anomaly-detections", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_anomaly(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "CONTRACT_ANOMALY_DETECTION")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/rooms/availability-searches", response_model=AiResponse, responses=ERROR_RESPONSES)
def room_availability(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "ROOM_AVAILABILITY_SEARCH")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/common-spaces/recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def common_space_recommend(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "COMMON_SPACE_RECOMMEND")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/payments/summary-documents", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_summary(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "PAYMENT_SUMMARY_DOCUMENT")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/payments/status-summaries", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_status(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "PAYMENT_STATUS_SUMMARY")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/payments/order-suggestions", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_suggest(payload: Dict[str, Any] = Body(...)):
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "ROOMSERVICE_STOCK_MONITOR")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)

@router.post("/operations/complaint-priority-classification", response_model=AiResponse, responses=ERROR_RESPONSES)
def complaint_priority(payload: Dict[str, Any] = Body(...)):
    payload.setdefault("intent", "COMPLAIN_PRIORITY_CLASSIFY")
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse): return parsed
    return execute_ai_request(parsed)
