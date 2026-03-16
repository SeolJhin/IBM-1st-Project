# app/services/anomaly/complain_priority_classify.py
# 위치: AI/app/services/anomaly/complain_priority_classify.py
#
# LLM 자동 폴백(Fallback) 순서: Groq → OpenAI → Watsonx
# 토큰 부족 / API 오류 시 자동으로 다음 LLM으로 넘어감.

import json
import logging
import re

from app.config.settings import settings

logger = logging.getLogger(__name__)

# 키워드 규칙 (keyword_weight = 0.4)
HIGH_KEYWORDS = ["화재", "가스", "폭발", "감전", "긴급", "위험",
                 "쓰러", "의식", "범죄", "폭력", "칼", "자해", "비상", "출동"]
LOW_KEYWORDS  = ["문의", "건의", "추가", "알려주", "가능한가요", "궁금"]


def classify_complain(title: str, content: str) -> dict:
    """
    반환값: {"importance": "high|medium|low", "ai_reason": "한 문장 근거"}
    """
    text = f"{title} {content}"

    # 1단계: 키워드 규칙으로 빠르게 판단 (keyword_weight = 0.4)
    if any(k in text for k in HIGH_KEYWORDS):
        keyword_score = 1.0   # high
    elif any(k in text for k in LOW_KEYWORDS):
        keyword_score = 0.0   # low
    else:
        keyword_score = 0.5   # medium

    # 2단계: LLM 호출 (실패 시 다음 LLM으로 자동 폴백)
    llm_result = _call_llm_with_fallback(title, content)

    # 3단계: LLM 실패 시 키워드 결과를 그대로 사용
    if not llm_result:
        if keyword_score == 1.0:
            importance = "high"
        elif keyword_score == 0.0:
            importance = "low"
        else:
            importance = "medium"
        return {"importance": importance, "ai_reason": "키워드 규칙 적용"}

    # 4단계: 키워드 + LLM 결합
    llm_score = {"high": 1.0, "medium": 0.5, "low": 0.0}.get(
        llm_result.get("importance", "medium"), 0.5
    )
    final_score = keyword_score * 0.4 + llm_score * 0.6

    if final_score >= 0.75:
        importance = "high"
    elif final_score >= 0.35:
        importance = "medium"
    else:
        importance = "low"

    return {
        "importance": importance,
        "ai_reason": llm_result.get("reason", "AI 분석 완료"),
    }


# ── LLM 폴백 체인 ──────────────────────────────────────────────────────────────

def _call_llm_with_fallback(title: str, content: str) -> dict:
    """
    LLM 폴백 순서: Groq → OpenAI → Watsonx
    각 단계에서 성공하면 즉시 반환, 실패하면 다음 단계로 넘어감.
    전부 실패하면 빈 dict 반환 → 키워드 점수만으로 판단.
    """
    prompt = _build_prompt(title, content)

    # 0순위: Groq
    if settings.groq_api_key:
        logger.info("[COMPLAIN_CLASSIFY] Groq 호출 시도")
        raw = _call_openai_compatible(
            prompt,
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model=settings.groq_model,
        )
        result = _parse_json(raw)
        if result:
            logger.info("[COMPLAIN_CLASSIFY] Groq 성공")
            return result
        logger.warning("[COMPLAIN_CLASSIFY] Groq 실패 → OpenAI로 전환")

    # 1순위: OpenAI
    if settings.openai_api_key:
        logger.info("[COMPLAIN_CLASSIFY] OpenAI 호출 시도")
        raw = _call_openai_compatible(
            prompt,
            api_key=settings.openai_api_key,
            base_url=None,
            model=settings.openai_model,
        )
        result = _parse_json(raw)
        if result:
            logger.info("[COMPLAIN_CLASSIFY] OpenAI 성공")
            return result
        logger.warning("[COMPLAIN_CLASSIFY] OpenAI 실패 → Watsonx로 전환")

    # 2순위: Watsonx
    if settings.watsonx_api_key:
        logger.info("[COMPLAIN_CLASSIFY] Watsonx 호출 시도")
        raw = _call_watsonx(prompt)
        result = _parse_json(raw)
        if result:
            logger.info("[COMPLAIN_CLASSIFY] Watsonx 성공")
            return result
        logger.warning("[COMPLAIN_CLASSIFY] Watsonx 실패")

    # 전부 실패 → 키워드 점수만으로 판단
    logger.error("[COMPLAIN_CLASSIFY] 모든 LLM 실패 → 키워드 규칙만 사용")
    return {}


# ── 프롬프트 빌더 ───────────────────────────────────────────────────────────────

def _build_prompt(title: str, content: str) -> str:
    return f"""민원 제목: {title}
민원 내용: {content}

위 민원의 중요도를 분류하세요.
- high: 안전사고·화재·범죄·긴급 대응 필요
- medium: 시설 고장·소음·생활 불편
- low: 단순 문의·건의·개선 요청

반드시 JSON만 출력 (다른 설명 없이):
{{"importance": "high|medium|low", "reason": "한 문장 근거"}}"""


# ── LLM 호출 함수들 ─────────────────────────────────────────────────────────────

def _call_openai_compatible(prompt: str, api_key: str, base_url: str | None, model: str) -> str:
    """OpenAI 또는 OpenAI 호환 API(Groq 등) 호출."""
    if not api_key:
        logger.warning("[COMPLAIN_CLASSIFY] API key 없음")
        return ""
    try:
        from openai import OpenAI
        kwargs: dict = {"api_key": api_key, "timeout": 20.0}
        if base_url:
            kwargs["base_url"] = base_url
        client = OpenAI(**kwargs)
        resp = client.chat.completions.create(
            model=model,
            temperature=0.0,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[COMPLAIN_CLASSIFY] OpenAI/Groq 호출 실패: {e}")
        return ""


def _call_watsonx(prompt: str) -> str:
    """IBM Watsonx API 호출."""
    if not settings.watsonx_api_key:
        logger.warning("[COMPLAIN_CLASSIFY] Watsonx API key 없음")
        return ""
    try:
        from ibm_watsonx_ai import Credentials
        from ibm_watsonx_ai.foundation_models import ModelInference
        model = ModelInference(
            model_id=settings.watsonx_model_id,
            credentials=Credentials(
                api_key=settings.watsonx_api_key,
                url=settings.watsonx_url,
            ),
            project_id=settings.watsonx_project_id,
            params={"temperature": 0.0, "max_new_tokens": 200},
        )
        return model.generate_text(prompt=prompt) or ""
    except Exception as e:
        logger.error(f"[COMPLAIN_CLASSIFY] Watsonx 호출 실패: {e}")
        return ""


# ── JSON 파싱 ───────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> dict:
    """LLM 응답에서 JSON 파싱. 실패 시 빈 dict 반환."""
    if not raw:
        return {}
    try:
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        logger.warning(f"[COMPLAIN_CLASSIFY] JSON 파싱 실패: {e}, raw={raw[:100]}")
    return {}