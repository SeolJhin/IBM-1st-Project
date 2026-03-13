"""
AI 라우터 — UNI PLACE FastAPI
위치: AI/app/api/v1/routes_ai_rest.py
"""
import logging
from typing import Any, Dict, Optional
from pathlib import Path
import tempfile

from fastapi import APIRouter, Body, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse, Response, FileResponse
from pydantic import BaseModel

from app.config.settings import settings
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
    parsed = parse_ai_request(payload)
    if isinstance(parsed, JSONResponse):
        return parsed
    return execute_ai_request(parsed)

def _set_intent(payload: Dict[str, Any], default_intent: str) -> None:
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
    _set_intent(payload, "AI_AGENT_CHATBOT")
    # ★ 디버그: Spring에서 수신한 userId 확인 로그
    logger.info("[agent-chatbot] received userId=%s slots_keys=%s",
                payload.get("userId", "MISSING"),
                list((payload.get("slots") or {}).keys()))
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


@router.post("/payments/order-forms", response_model=AiResponse, responses=ERROR_RESPONSES)
def payment_order_form(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "PAYMENT_ORDER_FORM_CREATE")
    return _run(payload)


@router.get("/payments/order-forms/downloads/{file_name}", responses=ERROR_RESPONSES)
def download_payment_order_form(file_name: str) -> FileResponse:
    safe_name = Path(file_name).name
    if safe_name != file_name or not safe_name.lower().endswith(".xlsx"):
        raise HTTPException(400, "Invalid file name")

    base_dir = Path(settings.payment_order_output_dir).resolve()
    target = (base_dir / safe_name).resolve()
    if base_dir not in target.parents:
        raise HTTPException(400, "Invalid file path")
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "File not found")

    return FileResponse(
        path=target,
        filename=safe_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

# ── operations ────────────────────────────────────────────────────────────────
@router.post("/operations/roomservice-stock-monitoring", response_model=AiResponse, responses=ERROR_RESPONSES)
def roomservice_stock(payload: Dict[str, Any] = Body(...)) -> AiResponse | JSONResponse:
    _set_intent(payload, "ROOMSERVICE_STOCK_MONITOR")
    return _run(payload)


@router.post("/operations/complaint-priority-classification")
def complaint_priority(payload: Dict[str, Any] = Body(...)):
    """
    Java ComplainAiClient 전용 엔드포인트.

    Java 요청: {"comp_title": "...", "comp_ctnt": "..."}
    Java 기대 응답: {"importance": "high|medium|low", "ai_reason": "한 문장 근거"}

    intent_router(키워드 기반)를 거치지 않고
    LLM 기반 classify_complain() 직접 호출.
    """
    try:
        from app.services.anomaly.complain_priority_classify import classify_complain

        slots   = payload.get("slots") or {}
        title   = payload.get("comp_title") or slots.get("comp_title") or ""
        content = payload.get("comp_ctnt")  or slots.get("comp_ctnt")  or ""

        logger.info(f"[COMPLAIN_CLASSIFY] title={title[:30]!r}")

        result = classify_complain(title, content)
        return {
            "importance": result.get("importance", "medium"),
            "ai_reason":  result.get("ai_reason", ""),
        }

    except Exception as e:
        logger.error(f"[COMPLAIN_CLASSIFY] 오류: {e}", exc_info=True)
        return {"importance": "medium", "ai_reason": ""}


@router.post("/operations/room-recommendation")
def room_recommendation(payload: Dict[str, Any] = Body(...)):
    try:
        from app.ai.room_recommend import recommend_rooms
        import asyncio

        rooms = payload.get("rooms") or []
        logger.info(f"[ROOM_RECOMMEND] 후보 방 수: {len(rooms)}")

        if not rooms:
            return []

        result = asyncio.run(recommend_rooms(payload))
        logger.info(f"[ROOM_RECOMMEND] Top3 결과: {result}")
        return result

    except Exception as e:
        logger.error(f"[ROOM_RECOMMEND] 오류: {e}", exc_info=True)
        return []


# ── voice STT/TTS ─────────────────────────────────────────────────────────────
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


# ── inspections ───────────────────────────────────────────────────────────────

class InspectionImageRequest(BaseModel):
    """
    Spring Boot에서 전송하는 이미지 비교 요청 DTO

    before_image_b64: 이전 점검 이미지 (base64). 첫 점검이면 None.
    after_image_b64 : 금번 점검 이미지 (base64). 항상 필수.
    space_type      : 점검 공간 종류 (room / building / common_space)
    space_id        : 해당 공간의 ID
    """
    before_image_b64: Optional[str] = None
    after_image_b64: str
    space_type: str
    space_id: int


class DetectedIssueResponse(BaseModel):
    issue_type: str
    severity: str
    description: str


class InspectionImageResponse(BaseModel):
    """Python AI 서버가 Spring Boot로 반환하는 분석 결과"""
    change_percent: float
    has_significant_change: bool
    diff_image_b64: Optional[str] = None   # 차이 강조 이미지 (base64)
    detected_issues: list[DetectedIssueResponse] = []
    ai_summary: str = ""
    is_first_inspection: bool = False       # 첫 점검(before 없음) 여부


@router.post("/inspections/image-compare", response_model=InspectionImageResponse)
def inspection_image_compare(req: InspectionImageRequest):
    """
    건물 점검 Before/After 이미지 비교 엔드포인트

    처리 흐름:
    1. before 이미지가 없으면 (첫 점검) → 비교 없이 저장만 안내
    2. OpenCV로 before/after 이미지 차이 계산
    3. 변화율이 1% 이상이면 Gemini Vision으로 손상 분석
    4. 결과 반환 → Spring Boot가 DB에 저장
    """
    from app.services.inspection.image_diff import compare_images
    from app.services.inspection.damage_analyzer import analyze_damage

    logger.info(f"[INSPECTION] 점검 요청 - space_type={req.space_type}, space_id={req.space_id}")

    # ── 첫 점검 (before 이미지 없음) ────────────────────────────────────────
    if not req.before_image_b64:
        logger.info("[INSPECTION] 첫 점검 → 비교 없이 저장")
        return InspectionImageResponse(
            change_percent=0.0,
            has_significant_change=False,
            diff_image_b64=None,
            detected_issues=[],
            ai_summary="첫 번째 점검입니다. 이 이미지가 다음 점검의 기준(Before)으로 사용됩니다.",
            is_first_inspection=True,
        )

    try:
        # ── OpenCV 이미지 비교 ────────────────────────────────────────────────
        diff_result = compare_images(req.before_image_b64, req.after_image_b64)
        logger.info(f"[INSPECTION] 변화율: {diff_result.change_percent}%")

        # ── 변화 없으면 Gemini 호출 생략 (API 비용/시간 절약) ────────────────
        if not diff_result.has_significant_change:
            return InspectionImageResponse(
                change_percent=diff_result.change_percent,
                has_significant_change=False,
                diff_image_b64=diff_result.diff_image_b64,
                detected_issues=[],
                ai_summary="이전 점검 대비 유의미한 변화가 감지되지 않았습니다.",
            )

        # ── Gemini Vision 손상 분석 ───────────────────────────────────────────
        analysis = analyze_damage(
            after_image_b64=req.after_image_b64,
            diff_image_b64=diff_result.diff_image_b64,
            change_percent=diff_result.change_percent,
        )

        issues = [
            DetectedIssueResponse(
                issue_type=issue.issue_type,
                severity=issue.severity,
                description=issue.description,
            )
            for issue in analysis.detected_issues
        ]

        return InspectionImageResponse(
            change_percent=diff_result.change_percent,
            has_significant_change=diff_result.has_significant_change,
            diff_image_b64=diff_result.diff_image_b64,
            detected_issues=issues,
            ai_summary=analysis.ai_summary,
        )

    except ValueError as e:
        logger.error(f"[INSPECTION] 이미지 처리 오류: {e}")
        raise HTTPException(status_code=400, detail=f"이미지 처리 오류: {str(e)}")
    except Exception as e:
        logger.error(f"[INSPECTION] 예상치 못한 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="이미지 분석 중 서버 오류가 발생했습니다.")
