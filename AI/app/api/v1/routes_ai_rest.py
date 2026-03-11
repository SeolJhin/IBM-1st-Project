"""
AI 라우터 — UNI PLACE FastAPI
위치: AI/app/api/v1/routes_ai.py
"""
import logging
from typing import Any, Dict, Optional
from pathlib import Path
import tempfile

from fastapi import APIRouter, Body, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse, Response

from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request, parse_ai_request
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

_voice_pipeline = None

def get_voice_pipeline():
    global _voice_pipeline
    if _voice_pipeline is None:
        try:
            from app.voice.pipeline.voice_pipeline import VoicePipeline
            _voice_pipeline = VoicePipeline()
        except Exception as e:
            logger.warning(f"VoicePipeline 로드 실패: {e}")
    return _voice_pipeline

def _run(payload: Dict[str, Any]) -> AiResponse | JSONResponse:
    """공통 실행 헬퍼"""
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse):
        return parsed
    return execute_ai_request(parsed)

def _set_intent(payload: Dict[str, Any], default_intent: str) -> None:
    """
    Spring이 보낸 intent가 있으면 유지, 없으면 default 사용.
    Spring은 AiGatewayRequest.intent (enum) → JSON 직렬화 시 문자열로 전송.
    """
    if not payload.get("intent"):
        payload["intent"] = default_intent

# ── fallback ──────────────────────────────────────────────────────────────────
@router.post("/execute", response_model=AiResponse, responses=ERROR_RESPONSES)
def execute(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "GENERAL_QA")
    return _run(payload)

# ── chat/general-qa ───────────────────────────────────────────────────────────
@router.post("/chat/general-qa", response_model=AiResponse, responses=ERROR_RESPONSES)
def general_qa(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "GENERAL_QA")
    return _run(payload)

# ── chat/agent-chatbot ────────────────────────────────────────────────────────
@router.post("/chat/agent-chatbot", response_model=AiResponse, responses=ERROR_RESPONSES)
def agent_chatbot(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    """
    Spring AiAgentChatbotUseCase → 여기로 옴.
    Spring이 보낸 intent 그대로 사용 (AI_AGENT_CHATBOT / GENERAL_QA 등).
    """
    _set_intent(payload, "AI_AGENT_CHATBOT")
    return _run(payload)

# ── chat/voice-assistant ──────────────────────────────────────────────────────
@router.post("/chat/voice-assistant", response_model=AiResponse, responses=ERROR_RESPONSES)
def voice_assistant(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    if not payload.get("prompt"):
        slots = payload.get("slots") or {}
        transcribed = slots.get("transcribed_text") or payload.get("transcribed_text", "")
        payload["prompt"] = transcribed
    _set_intent(payload, "GENERAL_QA")
    return _run(payload)

# ── search/rag ────────────────────────────────────────────────────────────────
@router.post("/search/rag", response_model=AiResponse, responses=ERROR_RESPONSES)
def rag_search(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "AI_AGENT_RAG_SEARCH")
    return _run(payload)

# ── community ─────────────────────────────────────────────────────────────────
@router.post("/community/content-search", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_search(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "COMMUNITY_CONTENT_SEARCH")
    return _run(payload)

@router.post("/community/content-moderation", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_moderation(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "COMMUNITY_CONTENT_MODERATION")
    return _run(payload)

# ── contracts ─────────────────────────────────────────────────────────────────
@router.post("/contracts/renewal-recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_renewal(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "CONTRACT_RENEWAL_RECOMMEND")
    return _run(payload)

@router.post("/contracts/anomaly-detections", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_anomaly(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "CONTRACT_ANOMALY_DETECTION")
    return _run(payload)

# ── rooms ─────────────────────────────────────────────────────────────────────
@router.post("/rooms/availability-searches", response_model=AiResponse, responses=ERROR_RESPONSES)
def room_availability(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "ROOM_AVAILABILITY_SEARCH")
    return _run(payload)

# ── common-spaces ─────────────────────────────────────────────────────────────
@router.post("/common-spaces/recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def common_space_recommend(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "COMMON_SPACE_RECOMMEND")
    return _run(payload)

# ── payments ──────────────────────────────────────────────────────────────────
@router.post("/payments/summary-documents", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_summary(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "PAYMENT_SUMMARY_DOCUMENT")
    return _run(payload)

@router.post("/payments/status-summaries", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_status(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "PAYMENT_STATUS_SUMMARY")
    return _run(payload)

@router.post("/payments/order-suggestions", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_suggest(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "PAYMENT_ORDER_SUGGESTION")
    return _run(payload)

# ── operations ────────────────────────────────────────────────────────────────
@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "ROOMSERVICE_STOCK_MONITOR")
    return _run(payload)

@router.post("/operations/complaint-priority-classification", response_model=AiResponse, responses=ERROR_RESPONSES)
def complaint_priority(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "COMPLAIN_PRIORITY_CLASSIFY")
    return _run(payload)

# ── voice STT/TTS (선택) ──────────────────────────────────────────────────────
@router.post("/voice/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    pipeline = get_voice_pipeline()
    if pipeline is None:
        raise HTTPException(503, "STT 서비스 미준비")
    content = await file.read()
    suffix = Path(file.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)
    try:
        result = pipeline.stt_only(tmp_path, language=language)
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        tmp_path.unlink(missing_ok=True)
    return {"text": result.text, "language": result.language}

@router.post("/voice/tts")
async def text_to_speech(
    text: str = Form(...),
    lang: Optional[str] = Form(None),
    speed: float = Form(1.0),
    output_format: str = Form("wav"),
):
    pipeline = get_voice_pipeline()
    if pipeline is None:
        raise HTTPException(503, "TTS 서비스 미준비")
    try:
        result = pipeline.tts_only(text, lang=lang, speed=speed, output_format=output_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    media_types = {"wav": "audio/wav", "mp3": "audio/mpeg", "ogg": "audio/ogg"}
    return Response(content=result.audio_bytes, media_type=media_types.get(output_format, "audio/wav"))
