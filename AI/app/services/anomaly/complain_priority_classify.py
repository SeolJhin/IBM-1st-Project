# app/services/anomaly/complain_priority_classify.py
# 위치: AI/app/services/anomaly/complain_priority_classify.py
#
# LLM_PROVIDER 설정에 따라 OpenAI / Groq / Watsonx 자동 선택.
# Watsonx API 키 오류 시에도 OpenAI/Groq 폴백으로 정상 동작.

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

    # 2단계: LLM 호출
    llm_result = _call_llm(title, content)

    # 3단계: 키워드 + LLM 결합 (high_priority_threshold = 0.75)
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


# ── LLM 호출 (provider 자동 선택) ─────────────────────────────────────────────

def _build_prompt(title: str, content: str) -> str:
    return f"""민원 제목: {title}
민원 내용: {content}

위 민원의 중요도를 분류하세요.
- high: 안전사고·화재·범죄·긴급 대응 필요
- medium: 시설 고장·소음·생활 불편
- low: 단순 문의·건의·개선 요청

반드시 JSON만 출력 (다른 설명 없이):
{{"importance": "high|medium|low", "reason": "한 문장 근거"}}"""


def _call_llm(title: str, content: str) -> dict:
    """LLM 호출 후 {"importance": ..., "reason": ...} 반환. 실패 시 빈 dict."""
    provider = (settings.llm_provider or "openai").lower()
    prompt   = _build_prompt(title, content)

    raw = ""
    if provider == "watsonx":
        raw = _call_watsonx(prompt)
    elif provider == "groq":
        raw = _call_openai_compatible(
            prompt,
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model=settings.groq_model,
        )
    else:  # openai (기본값)
        raw = _call_openai_compatible(
            prompt,
            api_key=settings.openai_api_key,
            base_url=None,
            model=settings.openai_model,
        )

    return _parse_json(raw)


def _call_openai_compatible(prompt: str, api_key: str, base_url: str | None, model: str) -> str:
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