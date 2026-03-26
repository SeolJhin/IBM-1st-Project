# app/services/inspection/damage_analyzer.py
"""
Gemini Vision 기반 건물 손상 분석 서비스

차이 이미지(diff image)와 after 이미지를 Gemini Vision에 전달하여
어떤 종류의 건물 손상이 발생했는지 분석합니다.

Vision LLM: 텍스트뿐만 아니라 이미지도 이해할 수 있는 AI 모델.
Gemini는 Google의 Vision LLM으로 무료 API 키로 사용 가능.
"""

import io
import itertools
import json
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx
from PIL import Image

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ── 재시도 설정 ───────────────────────────────────────────────────────────────
# Gemini 무료 티어는 RPM(분당 요청 수) 기반 제한이므로 최소 60초 대기가 필요합니다.
# Retry-After 헤더: Google 서버가 "N초 후에 재시도하세요"라고 응답에 직접 알려주는 값
MAX_RETRIES = 1          # 재시도 1회 (총 2번 시도) — 60초 대기가 있어 그 이상은 실용적이지 않음
RETRY_FALLBACK_WAIT = 65 # Retry-After 헤더가 없을 때 기본 대기 시간(초) — 분 단위 제한이므로 65초

# ── 감지 가능한 문제 유형 ─────────────────────────────────────────────────────
# Gemini가 이 목록 안에서 issue_type을 반환하도록 프롬프트에 명시
ISSUE_TYPES = [
    # ── 건물 손상 ──────────────────────────────────────
    "wall_crack",        # 벽 균열
    "water_leak",        # 누수
    "ceiling_stain",     # 천장 얼룩
    "broken_light",      # 조명 파손
    "structural_damage", # 구조적 손상
    "paint_peeling",     # 도장 벗겨짐
    "mold",              # 곰팡이
    "floor_damage",      # 바닥 손상
    "window_damage",     # 창문 손상
    "door_damage",       # 문 손상
    "general_wear",      # 일반적인 노후화
    # ── 객실 생활 손상 ─────────────────────────────────
    "room_disorder",     # 객실 무단 훼손 / 심각한 무질서
    "furniture_damage",  # 가구 손상 또는 파손
    "trash_left",        # 쓰레기 방치
    "stain_on_surface",  # 바닥·벽·가구 표면 오염
    "missing_item",      # 비품 분실 또는 무단 이동
    "unauthorized_use",  # 객실 무단 사용 흔적
]

GEMINI_VISION_BASE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
)

# ── API 키 로테이션 ────────────────────────────────────────────────────────────
# 여러 키를 등록하면 자동으로 돌아가며 사용 → RPM 한도를 키 수만큼 늘림
_API_KEYS = [k for k in [
    settings.gemini_api_key,
    getattr(settings, 'gemini_api_key_2', None),
    getattr(settings, 'gemini_api_key_3', None),
] if k]
_key_cycle = itertools.cycle(_API_KEYS)

def _get_next_key() -> str:
    return next(_key_cycle)


def _resize_image_b64(b64_str: str, max_size: int = 768) -> str:
    """
    이미지를 max_size 이하로 줄여서 Gemini 토큰 사용량 절약
    768px 정도면 AI 분석에 충분하고 토큰은 약 70% 절감
    """
    img_bytes = __import__('base64').b64decode(b64_str)
    img = Image.open(io.BytesIO(img_bytes))
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    return __import__('base64').b64encode(buf.getvalue()).decode('utf-8')


@dataclass
class DetectedIssue:
    """AI가 감지한 개별 문제"""
    issue_type: str    # 문제 유형 (ISSUE_TYPES 중 하나)
    severity: str      # 심각도: low / medium / high / critical
    description: str   # 한국어 설명


@dataclass
class DamageAnalysisResult:
    """Gemini Vision 분석 결과"""
    detected_issues: list[DetectedIssue] = field(default_factory=list)
    ai_summary: str = ""      # 전체 요약 (한국어)
    raw_response: str = ""    # 디버깅용 원본 응답


def _call_gemini_with_retry(request_body: dict) -> httpx.Response:
    """
    Gemini API를 호출하되, 429(Rate Limit 초과) 발생 시 다음 키로 교체 후 재시도합니다.
    """
    for attempt in range(MAX_RETRIES + 1):
        current_key = _get_next_key()  # ← 매 시도마다 다음 키 사용
        url = f"{GEMINI_VISION_BASE_URL}{settings.gemini_model}:generateContent?key={current_key}"
        try:
            response = httpx.post(url, json=request_body, timeout=30.0)
            response.raise_for_status()
            return response

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < MAX_RETRIES:
                retry_after = e.response.headers.get("Retry-After")
                wait_seconds = int(retry_after) if retry_after else RETRY_FALLBACK_WAIT

                logger.warning(
                    f"[DAMAGE_ANALYZER] 429 Rate Limit 초과 "
                    f"(시도 {attempt + 1}/{MAX_RETRIES + 1}) "
                    f"→ 다음 키로 교체 후 {wait_seconds}초 대기 후 재시도"
                )
                time.sleep(wait_seconds)
            else:
                if e.response.status_code == 429:
                    logger.error("[DAMAGE_ANALYZER] 재시도 후에도 Rate Limit 초과 → 분석 포기")
                raise


def analyze_damage(
    after_image_b64: str,
    diff_image_b64: str,
    change_percent: float,
) -> DamageAnalysisResult:
    """
    Gemini Vision에 before/after 차이 이미지와 after 이미지를 전송하여
    건물 손상 여부를 분석합니다.

    Args:
        after_image_b64 : 금번 점검 이미지 (base64 JPEG/PNG)
        diff_image_b64  : OpenCV가 생성한 차이 강조 이미지 (base64 PNG)
        change_percent  : OpenCV가 계산한 변화율(%)

    Returns:
        DamageAnalysisResult: 감지된 문제 목록, 요약
    """
    if not _API_KEYS:
        logger.warning("[DAMAGE_ANALYZER] Gemini API 키 없음 → 분석 생략")
        return DamageAnalysisResult(ai_summary="Gemini API 키가 설정되지 않아 분석을 생략했습니다.")

    # ── 이미지 리사이즈 (토큰 절약) ──────────────────────────────────────────
    after_image_b64  = _resize_image_b64(after_image_b64,  max_size=768)
    diff_image_b64   = _resize_image_b64(diff_image_b64,   max_size=768)
    logger.info("[DAMAGE_ANALYZER] 이미지 리사이즈 완료 (768px)")

    # ── 프롬프트 작성 ─────────────────────────────────────────────────────────
    prompt = f"""
당신은 숙박 시설 유지보수 및 객실 관리 전문가 AI입니다.

첨부된 두 이미지를 분석해 주세요:
1. **after_image**: 최근 점검에서 촬영한 실제 이미지
2. **diff_image**: OpenCV가 이전 점검 이미지와 비교하여 변화된 영역을 빨간 사각형으로 표시한 이미지

OpenCV 변화율: {change_percent}%

감지 대상은 두 가지입니다:
- **건물 손상**: 벽 균열, 누수, 천장 얼룩, 곰팡이, 바닥 손상 등 구조적·물리적 손상
- **객실 생활 손상**: 쓰레기 방치, 가구 파손, 심각한 무질서, 표면 오염, 비품 분실 등 입주자로 인한 손상

아래 형식의 JSON만 응답하세요. 설명이나 마크다운 없이 JSON만:

{{
  "detected_issues": [
    {{
      "issue_type": "<아래 목록 중 하나>",
      "severity": "<low|medium|high|critical>",
      "description": "<한국어로 구체적인 설명, 50자 이내>"
    }}
  ],
  "ai_summary": "<전체 점검 결과 한국어 요약, 100자 이내>"
}}

issue_type은 반드시 아래 목록 중 하나를 사용하세요:
{', '.join(ISSUE_TYPES)}

변화율이 1% 미만이거나 이상이 없으면 detected_issues는 빈 배열([])로 반환하세요.
severity 기준:
- low: 즉각 조치 불필요, 정기 점검 시 확인
- medium: 1개월 내 조치 권장
- high: 1주일 내 조치 필요
- critical: 즉각 조치 필요 (안전 위험 또는 심각한 재산 손해)
""".strip()

    # ── Gemini API 요청 본문 구성 ────────────────────────────────────────────
    # Gemini Vision은 텍스트와 이미지를 함께 받는 멀티모달(multimodal) 요청
    request_body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        # after 이미지
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": after_image_b64,
                        }
                    },
                    {
                        # diff 이미지 (OpenCV가 변화 영역을 강조한 이미지)
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": diff_image_b64,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,      # 낮을수록 일관된 응답 (0.0~1.0)
            "maxOutputTokens": 4096,
        },
    }

    # ── Gemini API 호출 (재시도 로직 포함) ──────────────────────────────────
    raw_text = ""
    try:
        response = _call_gemini_with_retry(request_body)

        raw_text = (
            response.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        logger.info(f"[DAMAGE_ANALYZER] Gemini 응답: {raw_text[:200]}")

        # ── JSON 파싱 ─────────────────────────────────────────────────────────
        # Gemini가 가끔 ```json ... ``` 형식으로 감싸서 반환하는 경우 처리
        clean_text = raw_text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("```")[1]
            if clean_text.startswith("json"):
                clean_text = clean_text[4:]
        clean_text = clean_text.strip()
        # 잘린 JSON 방어: 닫는 괄호 보완
        if clean_text.count('{') > clean_text.count('}'):
            clean_text += '}' * (clean_text.count('{') - clean_text.count('}'))
        if clean_text.count('[') > clean_text.count(']'):
            clean_text += ']' * (clean_text.count('[') - clean_text.count(']'))
        # trailing comma 제거
        import re as _re_json
        clean_text = _re_json.sub(r',\s*([}\]])', r'\1', clean_text)

        parsed = json.loads(clean_text)

        issues = [
            DetectedIssue(
                issue_type=_safe_issue_type(item.get("issue_type", "general_wear")),
                severity=_safe_severity(item.get("severity", "medium")),
                description=item.get("description", "")[:500],
            )
            for item in parsed.get("detected_issues", [])
        ]

        return DamageAnalysisResult(
            detected_issues=issues,
            ai_summary=parsed.get("ai_summary", ""),
            raw_response=raw_text,
        )

    except json.JSONDecodeError as e:
        logger.error(f"[DAMAGE_ANALYZER] JSON 파싱 실패: {e}")
        return DamageAnalysisResult(
            ai_summary="AI 응답 파싱에 실패했습니다.",
            raw_response=raw_text,
        )
    except httpx.HTTPStatusError as e:
        # 429 최대 재시도 초과 또는 다른 HTTP 에러
        if e.response.status_code == 429:
            logger.error("[DAMAGE_ANALYZER] Rate Limit 초과로 분석 실패 (재시도 모두 소진)")
            return DamageAnalysisResult(
                ai_summary="API 요청 한도(Rate Limit)를 초과했습니다. 잠시 후 다시 시도해주세요."
            )
        logger.error(f"[DAMAGE_ANALYZER] Gemini HTTP 오류: {e}", exc_info=True)
        return DamageAnalysisResult(ai_summary=f"AI 분석 중 HTTP 오류가 발생했습니다: {e.response.status_code}")
    except Exception as e:
        logger.error(f"[DAMAGE_ANALYZER] Gemini 호출 실패: {e}", exc_info=True)
        return DamageAnalysisResult(ai_summary=f"AI 분석 중 오류가 발생했습니다: {type(e).__name__}")


def _safe_issue_type(value: str) -> str:
    """Gemini가 잘못된 issue_type을 반환할 경우 기본값으로 대체"""
    return value if value in ISSUE_TYPES else "general_wear"


def _safe_severity(value: str) -> str:
    """Gemini가 잘못된 severity를 반환할 경우 기본값으로 대체"""
    return value if value in ("low", "medium", "high", "critical") else "medium"