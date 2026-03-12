# 경로: app/ai/room_recommend.py
"""
방 추천 Top3 AI 로직
- Java RoomRecommendationAiClient 로부터 후보 방 목록(최대 20개)을 받아
- LLM(Groq / OpenAI / Watsonx)으로 Top3를 선별하고 추천 이유를 생성합니다.

Request (from Java):
{
  "rooms": [
    {
      "room_id": 1,
      "building_nm": "강남 코리빙",
      "room_type": "one_room",
      "rent_price": 500000,
      "avg_rating": 4.5,
      "review_count": 12,
      "contract_count": 8
    },
    ...
  ]
}

Response (to Java):
[
  {"room_id": 1, "rank": 1, "reason": "...", "score": 0.87},
  {"room_id": 3, "rank": 2, "reason": "...", "score": 0.75},
  {"room_id": 5, "rank": 3, "reason": "...", "score": 0.60}
]
"""

import json
import logging
import re
from typing import Any

from app.config.settings import settings

logger = logging.getLogger(__name__)

ROOM_TYPE_KO = {
    "one_room":   "원룸",
    "two_room":   "투룸",
    "three_room": "쓰리룸",
    "loft":       "복층",
    "share":      "쉐어룸",
}


def _build_prompt(rooms: list[dict]) -> str:
    lines = []
    for r in rooms:
        room_type_ko = ROOM_TYPE_KO.get(r.get("room_type", ""), r.get("room_type", "-"))
        lines.append(
            f"- room_id={r['room_id']} | 건물명: {r.get('building_nm', '?')} | "
            f"유형: {room_type_ko} | 월세: {r.get('rent_price', 0):,}원 | "
            f"평균 평점: {r.get('avg_rating', 0):.1f}점 | "
            f"리뷰 수: {r.get('review_count', 0)}건 | "
            f"계약 수: {r.get('contract_count', 0)}건"
        )

    room_list_str = "\n".join(lines)

    return f"""당신은 코리빙 주거 플랫폼의 AI 추천 엔진입니다.
아래 방 목록에서 입주자에게 추천할 Top3를 선택하고, 각 방의 추천 이유를 한 문장으로 설명하세요.

[후보 방 목록]
{room_list_str}

[선정 기준]
- 평균 평점이 높을수록 좋음 (가중치 50%)
- 리뷰 수가 많을수록 신뢰도 높음 (가중치 30%)
- 계약 수가 많을수록 검증된 방 (가중치 20%)

[출력 규칙]
- 반드시 JSON 배열만 출력하세요. 설명 텍스트나 마크다운 없이 순수 JSON만 출력하세요.
- 정확히 3개 항목을 출력하세요.
- rank는 1, 2, 3 순서입니다.
- score는 0.0~1.0 사이 소수점 2자리 숫자입니다.
- reason은 30자 이내 한국어 한 문장으로 작성하세요.
- room_id는 위 목록에 있는 값만 사용하세요.

[출력 형식 예시]
[
  {{"room_id": 1, "rank": 1, "reason": "높은 평점과 많은 리뷰로 입주 만족도가 검증된 방입니다.", "score": 0.87}},
  {{"room_id": 3, "rank": 2, "reason": "꾸준한 계약 이력으로 인기가 확인된 안정적인 공간입니다.", "score": 0.75}},
  {{"room_id": 5, "rank": 3, "reason": "합리적인 월세와 좋은 평점이 균형을 이루는 방입니다.", "score": 0.60}}
]"""


def _fallback_top3(rooms: list[dict]) -> list[dict]:
    """LLM 실패 시 통계 점수 기반 폴백 Top3 반환"""
    scored = []
    for r in rooms:
        score = (
            float(r.get("avg_rating", 0)) * 0.5
            + float(r.get("review_count", 0)) * 0.03
            + float(r.get("contract_count", 0)) * 0.02
        )
        scored.append((score, r))

    scored.sort(key=lambda x: x[0], reverse=True)
    top3 = scored[:3]

    result = []
    for rank, (score, r) in enumerate(top3, start=1):
        result.append({
            "room_id": r["room_id"],
            "rank":    rank,
            "reason":  "리뷰 평점과 계약 이력을 종합하여 선정된 추천 방입니다.",
            "score":   round(min(score / 5.0, 1.0), 2),
        })
    return result


# ── LLM 호출 (provider 자동 선택) ─────────────────────────────────────────────

def _call_llm(prompt: str) -> str:
    provider = (settings.llm_provider or "openai").lower()

    if provider == "watsonx":
        return _call_watsonx(prompt)
    elif provider == "groq":
        return _call_openai_compatible(
            prompt,
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model=settings.groq_model,
        )
    else:  # openai 기본값
        return _call_openai_compatible(
            prompt,
            api_key=settings.openai_api_key,
            base_url=None,
            model=settings.openai_model,
        )


def _call_openai_compatible(prompt: str, api_key: str, base_url: str | None, model: str) -> str:
    if not api_key:
        logger.warning("[RoomRecommend] API key 없음")
        return ""
    try:
        from openai import OpenAI
        kwargs: dict = {"api_key": api_key, "timeout": 30.0}
        if base_url:
            kwargs["base_url"] = base_url
        client = OpenAI(**kwargs)
        resp = client.chat.completions.create(
            model=model,
            temperature=0.2,
            messages=[{"role": "user", "content": prompt}],
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"[RoomRecommend] OpenAI/Groq 호출 실패: {e}")
        return ""


def _call_watsonx(prompt: str) -> str:
    if not settings.watsonx_api_key:
        logger.warning("[RoomRecommend] Watsonx API key 없음")
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
            params={"temperature": 0.2, "max_new_tokens": 400},
        )
        return model.generate_text(prompt=prompt) or ""
    except Exception as e:
        logger.error(f"[RoomRecommend] Watsonx 호출 실패: {e}")
        return ""


def _parse_result(raw: str, rooms: list[dict]) -> list[dict]:
    """LLM 응답 JSON 파싱. 실패 시 폴백."""
    try:
        clean = raw.strip()
        # 마크다운 코드블록 제거 (```json ... ```)
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean).rstrip("`").strip()

        match = re.search(r'\[.*\]', clean, re.DOTALL)
        if match:
            result = json.loads(match.group())
            if isinstance(result, list) and len(result) >= 1:
                valid_ids = {r["room_id"] for r in rooms}
                validated = []
                for item in result[:3]:
                    if item.get("room_id") not in valid_ids:
                        continue
                    validated.append({
                        "room_id": int(item["room_id"]),
                        "rank":    int(item.get("rank", len(validated) + 1)),
                        "reason":  str(item.get("reason", "AI 분석 완료")),
                        "score":   float(item.get("score", 0.7)),
                    })
                if validated:
                    return validated
    except Exception as e:
        logger.warning(f"[RoomRecommend] JSON 파싱 실패: {e}, raw={raw[:200]}")

    logger.warning("[RoomRecommend] LLM 결과 없음 → 폴백 사용")
    return _fallback_top3(rooms)


async def recommend_rooms(payload: dict[str, Any]) -> list[dict]:
    """
    메인 진입점 — routes_ai_rest.py 에서 호출됩니다.

    Args:
        payload: {"rooms": [...]}
    Returns:
        [{"room_id": int, "rank": int, "reason": str, "score": float}, ...]
    """
    rooms: list[dict] = payload.get("rooms", [])

    if not rooms:
        logger.warning("[RoomRecommend] 후보 방 목록이 비어있습니다.")
        return []

    if len(rooms) < 3:
        logger.warning("[RoomRecommend] 후보 방이 3개 미만(%d개). 폴백 사용.", len(rooms))
        return _fallback_top3(rooms)

    prompt = _build_prompt(rooms)
    raw    = _call_llm(prompt)
    result = _parse_result(raw, rooms)

    logger.info("[RoomRecommend] Top3 결정 완료: %s", result)
    
    return result