# app/api/v1/routes_ai.py
"""
AI 라우터 — UNI PLACE FastAPI

모든 챗봇 요청은 tool_orchestrator로 통합.
관리자용 분석 기능(anomaly detection 등)만 별도 유지.
"""
import logging
from pathlib import Path
import tempfile
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
##
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.orchestrator.tool_orchestrator import run_tool_orchestrator
from app.services.orchestrator.admin_tool_orchestrator import run_admin_tool_orchestrator
from app.services.anomaly.contract_anomaly import detect_contract_anomaly
from app.services.document.payment_summary_doc import make_payment_summary
from app.services.document.payment_order_suggestion import suggest_order_from_payment
from app.services.document.order_form_generator import create_order_form_from_suggestion
from app.services.rag.retriever import retrieve_context
from app.services.rag.generator import generate_answer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

ERROR_RESPONSES = {400: {"description": "Bad Request"}, 500: {"description": "Internal Server Error"}}

_voice_pipeline = None


def _voice():
    global _voice_pipeline
    if _voice_pipeline is None:
        try:
            from app.voice.pipeline.voice_pipeline import VoicePipeline
            _voice_pipeline = VoicePipeline()
        except Exception as e:
            logger.warning("VoicePipeline 로드 실패: %s", e)
    return _voice_pipeline


def _req(payload: Dict[str, Any], intent: str = "AI_AGENT_CHATBOT") -> AiRequest:
    if not payload.get("intent"):
        payload["intent"] = intent
    return AiRequest(**payload)


# ── 챗봇 (모두 tool_orchestrator) ─────────────────────────────────────────────

@router.post("/chat/agent-chatbot", response_model=AiResponse, responses=ERROR_RESPONSES)
def agent_chatbot(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "AI_AGENT_CHATBOT"))


@router.post("/chat/admin-chatbot", response_model=AiResponse, responses=ERROR_RESPONSES)
def admin_chatbot(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    """
    어드민 전용 챗봇.
    - Spring /ai/chat/admin-chatbot → @PreAuthorize("hasRole('ADMIN')") 보호
    - Python 측은 Spring이 ADMIN 검증 완료 후 호출한다고 신뢰
    - 모든 테이블 접근 가능, user_id 필터 불필요
    """
    return run_admin_tool_orchestrator(_req(payload, "AI_AGENT_CHATBOT"))


@router.post("/chat/general-qa", response_model=AiResponse, responses=ERROR_RESPONSES)
def general_qa(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "GENERAL_QA"))


@router.post("/chat/voice-assistant", response_model=AiResponse, responses=ERROR_RESPONSES)
def voice_assistant(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    if not payload.get("prompt"):
        slots = payload.get("slots") or {}
        payload["prompt"] = slots.get("transcribed_text") or payload.get("transcribed_text", "")
    return run_tool_orchestrator(_req(payload, "VOICE_CHATBOT"))


@router.post("/execute", response_model=AiResponse, responses=ERROR_RESPONSES)
def execute(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "GENERAL_QA"))


# ── RAG ───────────────────────────────────────────────────────────────────────

@router.post("/search/rag", response_model=AiResponse, responses=ERROR_RESPONSES)
def rag_search(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "AI_AGENT_RAG_SEARCH")
    docs = retrieve_context(req)
    answer = generate_answer(req, docs)
    return AiResponse(answer=answer, confidence=min(0.9, 0.6 + 0.1 * len(docs)))


# ── 커뮤니티 ──────────────────────────────────────────────────────────────────

@router.post("/community/content-search", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_search(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "COMMUNITY_CONTENT_SEARCH"))


@router.post("/community/content-moderation", response_model=AiResponse, responses=ERROR_RESPONSES)
def community_content_moderation(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "COMMUNITY_CONTENT_MODERATION")
    docs = retrieve_context(req)
    answer = generate_answer(req, docs)
    return AiResponse(answer=answer, confidence=min(0.9, 0.6 + 0.1 * len(docs)))


# ── 관리자/운영 전용 (기존 유지) ──────────────────────────────────────────────

@router.post("/contracts/anomaly-detections", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_anomaly(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "CONTRACT_ANOMALY_DETECTION")
    score, msg = detect_contract_anomaly(req)
    return AiResponse(answer=msg, confidence=score)


@router.post("/operations/complaint-priority-classification")
def complaint_priority(payload: Dict[str, Any] = Body(...)) -> dict:
    try:
        from app.services.anomaly.complain_priority_classify import classify_complain

        slots   = payload.get("slots") or {}
        title   = payload.get("comp_title") or slots.get("comp_title") or ""
        content = payload.get("comp_ctnt")  or slots.get("comp_ctnt")  or ""

        logger.info(f"[COMPLAIN_CLASSIFY] title={title[:30]!r} content={content[:30]!r}")

        result = classify_complain(title, content)
        importance = result.get("importance", "medium")
        ai_reason  = result.get("ai_reason", "")

        logger.info(f"[COMPLAIN_CLASSIFY] 결과 → importance={importance}, reason={ai_reason}")

        return {
            "importance": importance,
            "ai_reason":  ai_reason,
        }
    except Exception as e:
        logger.error(f"[COMPLAIN_CLASSIFY] 오류: {e}", exc_info=True)
        return {"importance": "medium", "ai_reason": ""}


@router.post("/payments/summary-documents", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_summary(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "PAYMENT_SUMMARY_DOCUMENT")
    answer, metadata = make_payment_summary(req)
    return AiResponse(answer=answer, confidence=0.85, metadata=metadata)


@router.post("/payments/status-summaries", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_status(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "PAYMENT_STATUS_SUMMARY"))


@router.post("/payments/order-suggestions", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_suggest(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "PAYMENT_ORDER_SUGGESTION")
    answer, metadata = suggest_order_from_payment(req)
    return AiResponse(answer=answer, confidence=0.85, metadata=metadata)


@router.post("/payments/order-forms", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_form(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    req = _req(payload, "PAYMENT_ORDER_FORM_CREATE")
    answer, metadata = create_order_form_from_suggestion(req)
    return AiResponse(answer=answer, confidence=0.85, metadata=metadata)


@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "ROOMSERVICE_STOCK_MONITOR"))


@router.post("/contracts/renewal-recommendations", response_model=AiResponse, responses=ERROR_RESPONSES)
def contract_renewal(payload: Dict[str, Any] = Body(...)) -> AiResponse:
    return run_tool_orchestrator(_req(payload, "CONTRACT_RENEWAL_RECOMMEND"))


# ── 음성 STT/TTS ──────────────────────────────────────────────────────────────

@router.post("/voice/stt")
async def speech_to_text(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    pipeline = _voice()
    if not pipeline:
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
    text: str = Form(...), lang: Optional[str] = Form(None),
    speed: float = Form(1.0), output_format: str = Form("wav"),
):
    pipeline = _voice()
    if not pipeline:
        raise HTTPException(503, "TTS 서비스 미준비")
    try:
        result = pipeline.tts_only(text, lang=lang, speed=speed, output_format=output_format)
    except Exception as e:
        raise HTTPException(500, str(e))
    media = {"wav": "audio/wav", "mp3": "audio/mpeg", "ogg": "audio/ogg"}
    return Response(content=result.audio_bytes, media_type=media.get(output_format, "audio/wav"))