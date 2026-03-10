"""
AI/app/api/v1/routes_ai.py

Spring /ai/** → FastAPI 포워딩 엔드포인트
voice STT/TTS는 React → FastAPI 직접 호출 (파일 전송 효율)
JWT: optional (토큰 없으면 guest, 있으면 검증 — Spring permitAll과 동일)
"""
import logging
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse, Response

from app.api.v1.executor import ERROR_RESPONSES, execute_ai_request, parse_ai_request
from app.core.jwt_auth import TokenUser, get_optional_user
from app.schemas.ai_response import AiResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

# ── Voice Pipeline 지연 로드 싱글톤 ──────────────────────────
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        try:
            from app.voice.pipeline.voice_pipeline import VoicePipeline
            _pipeline = VoicePipeline()
            logger.info("VoicePipeline 로드 완료 ✓")
        except Exception as e:
            logger.warning(f"VoicePipeline 로드 실패 (STT/TTS 비활성): {e}")
    return _pipeline


# ════════════════════════════════════════════════════════════
#  Spring → FastAPI 텍스트 AI 엔드포인트
# ════════════════════════════════════════════════════════════

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


# ════════════════════════════════════════════════════════════
#  Voice STT/TTS — React 직접 호출 (파일 전송 효율)
#  JWT optional: 토큰 없으면 guest, 있으면 검증
#  Spring /ai/** permitAll과 동일한 보안 수준
# ════════════════════════════════════════════════════════════

@router.post("/voice/stt")
async def speech_to_text(
    file: UploadFile = File(..., description="오디오 파일 (wav, mp3, webm)"),
    language: Optional[str] = Form(None),
    current_user: TokenUser = Depends(get_optional_user),  # JWT optional
):
    """
    음성 → 텍스트 (Whisper STT)
    React 마이크 버튼 → 여기로 직접 호출
    """
    pipeline = get_pipeline()
    if pipeline is None:
        raise HTTPException(503, "STT 서비스 미준비 (faster-whisper 설치 필요)")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(413, "파일 크기 초과 (최대 50MB)")

    suffix = Path(file.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        result = pipeline.stt_only(tmp_path, language=language)
    except Exception as e:
        logger.exception(f"STT 오류 [user={current_user.user_id}]")
        raise HTTPException(500, str(e))
    finally:
        tmp_path.unlink(missing_ok=True)

    logger.info(f"STT 완료 [user={current_user.user_id}] '{result.text[:60]}'")
    return {
        "text": result.text,
        "language": result.language,
        "language_probability": result.language_probability,
        "processing_time_s": result.processing_time_s,
    }


@router.post("/voice/tts")
async def text_to_speech(
    text: str = Form(...),
    lang: Optional[str] = Form(None),
    speed: float = Form(1.0),
    output_format: str = Form("wav"),
    current_user: TokenUser = Depends(get_optional_user),  # JWT optional
):
    """
    텍스트 → 음성 (MeloTTS)
    AI 답변 → React 음성 재생 시 호출
    """
    pipeline = get_pipeline()
    if pipeline is None:
        raise HTTPException(503, "TTS 서비스 미준비 (MeloTTS 설치 필요)")

    if not text.strip():
        raise HTTPException(400, "텍스트가 비어있습니다")
    if len(text) > 5000:
        raise HTTPException(400, "텍스트 길이 초과 (최대 5000자)")

    try:
        result = pipeline.tts_only(text, lang=lang, speed=speed, output_format=output_format)
    except Exception as e:
        logger.exception(f"TTS 오류 [user={current_user.user_id}]")
        raise HTTPException(500, str(e))

    logger.info(f"TTS 완료 [user={current_user.user_id}] {result.duration_s:.1f}s")
    media_types = {"wav": "audio/wav", "mp3": "audio/mpeg", "ogg": "audio/ogg"}
    return Response(
        content=result.audio_bytes,
        media_type=media_types.get(output_format, "audio/wav"),
        headers={
            "X-Duration-S": str(result.duration_s),
            "X-Processing-Time": str(result.processing_time_s),
        },
    )
