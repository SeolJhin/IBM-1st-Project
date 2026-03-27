# 경로: app/ai/room_recommend.py
"""
방 추천 Top3 AI 로직

Request (from Java):
{
  "rooms": [...],
  "user_query": "조용하고 채광 좋은 원룸, 월세 50만원 이하"  ← 선택
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

SUN_KO = {"n": "북향", "s": "남향", "e": "동향", "w": "서향"}


# ── 사전 필터링 ───────────────────────────────────────────────────────────────

def _prefilter_rooms(rooms: list[dict], user_query: str) -> list[dict]:
    """사용자 쿼리에서 조건을 추출하여 매칭되는 방을 우선 선별 (최대 12개)."""
    q = user_query.lower().replace(" ", "")
    scored = []

    for r in rooms:
        score = 0
        room_text = " ".join([
            str(r.get("room_desc", "") or ""),
            str(r.get("room_options", "") or ""),
            ROOM_TYPE_KO.get(r.get("room_type", ""), ""),
            SUN_KO.get(r.get("sun_direction", ""), ""),
        ]).lower()

        # 방 타입 매칭
        if "원룸" in q and r.get("room_type") == "one_room": score += 3
        if "투룸" in q and r.get("room_type") == "two_room": score += 3
        if "쓰리룸" in q and r.get("room_type") == "three_room": score += 3
        if ("복층" in q or "로프트" in q) and r.get("room_type") == "loft": score += 3
        if ("쉐어" in q or "셰어" in q) and r.get("room_type") == "share": score += 3

        # 방향 매칭
        if "남향" in q and r.get("sun_direction") == "s": score += 2
        if "북향" in q and r.get("sun_direction") == "n": score += 2
        if "동향" in q and r.get("sun_direction") == "e": score += 2
        if "서향" in q and r.get("sun_direction") == "w": score += 2

        # 반려동물 매칭
        if ("반려동물" in q or "펫" in q or "애완" in q) and r.get("pet_allowed_yn") == "Y": score += 2

        # 가격 매칭 (N만원 이하)
        import re as _re
        price_match = _re.search(r"(\d+)\s*만\s*원?\s*이하", user_query)
        if price_match:
            max_price = int(price_match.group(1)) * 10000
            if int(r.get("rent_price", 0)) <= max_price: score += 3

        # 옵션 키워드 매칭
        option_keywords = ["에어컨", "세탁기", "냉장고", "인덕션", "풀옵션", "침대", "책상", "TV"]
        for kw in option_keywords:
            if kw in q and kw.lower() in room_text: score += 1

        # 분위기 키워드
        if "조용" in q: score += 0.5
        if "넓" in q and float(r.get("room_size", 0)) > 25: score += 1
        if "채광" in q and r.get("sun_direction") == "s": score += 1

        scored.append((score, r))

    # 점수순 정렬 → 상위 12개
    scored.sort(key=lambda x: x[0], reverse=True)
    result = [r for _, r in scored[:12]]

    # 최소 5개 확보 (점수 0이어도)
    if len(result) < 5:
        result = [r for _, r in scored[:5]]

    logger.info("[RoomRecommend] 사전필터: query='%s' → %d/%d개 선별", user_query, len(result), len(rooms))
    return result


# ── LLM 프롬프트 구성 ─────────────────────────────────────────────────────────

def _build_room_summary(r: dict) -> str:
    room_type_ko = ROOM_TYPE_KO.get(r.get("room_type", ""), r.get("room_type", "-"))
    sun = SUN_KO.get(r.get("sun_direction", ""), "-")
    pet = "가능" if r.get("pet_allowed_yn") == "Y" else "불가"
    options = r.get("room_options", "") or "-"
    desc = r.get("room_desc", "") or ""
    desc_short = desc[:100] + "…" if len(desc) > 100 else desc
    total_cost = int(r.get("rent_price", 0)) + int(r.get("manage_fee") or 0)

    return (
        f"[room_id={r['room_id']}] {r.get('building_nm', '?')} {r.get('floor', '?')}층\n"
        f"  유형: {room_type_ko} | 면적: {r.get('room_size', '?')}㎡ | 채광: {sun} | 반려동물: {pet}\n"
        f"  월세: {int(r.get('rent_price', 0)):,}원 | 관리비: {int(r.get('manage_fee') or 0):,}원 "
        f"→ 총: {total_cost:,}원/월\n"
        f"  보증금: {int(r.get('deposit') or 0):,}원 | 최소거주: {r.get('rent_min', '-')}개월\n"
        f"  옵션: {options}\n"
        f"  평점: {float(r.get('avg_rating', 0)):.1f}점 | 리뷰: {r.get('review_count', 0)}건 | "
        f"계약: {r.get('contract_count', 0)}건\n"
        f"  소개: {desc_short}"
    )


def _build_prompt_personalized(rooms: list[dict], user_query: str) -> str:
    room_list_str = "\n\n".join(_build_room_summary(r) for r in rooms)

    return f"""당신은 코리빙(Co-living) 주거 플랫폼의 AI 추천 전문가입니다.

[입주 희망자 요청사항]
"{user_query}"

[후보 방 목록]
{room_list_str}

[지시사항]
- 위 요청사항에 가장 잘 맞는 방 Top3를 선정하세요.
- 요청사항에서 언급된 조건(예산, 유형, 방향, 반려동물, 옵션 등)을 직접 매핑하여 평가하세요.
- 요청사항에 없는 조건은 방의 옵션·면적·채광·월세 등 객관적 특징을 참고하세요.
- 평점·리뷰가 없는 신규 방도 조건에 맞으면 적극 추천하세요. 리뷰 유무로 차별하지 마세요.
- 각 방의 추천 이유는 반드시 해당 입주자의 요청사항과 연결하여 구체적으로 작성하세요.
- 이유는 60~90자 한국어 2문장으로 작성하세요. 각 방마다 다른 관점(가격, 옵션, 채광, 위치, 면적 등)에서 차별화된 매력을 설명하세요. 3개 방의 이유가 비슷한 패턴이면 안 됩니다.

[출력 규칙]
반드시 순수 JSON 배열만 출력. 마크다운·코드블록 금지. 정확히 3개. room_id는 위 목록 값만 사용.

[출력 형식]
[{{"room_id":1,"rank":1,"reason":"60~90자 차별화된 이유","score":0.9}},{{"room_id":2,"rank":2,"reason":"60~90자 차별화된 이유","score":0.8}},{{"room_id":3,"rank":3,"reason":"60~90자 차별화된 이유","score":0.7}}]"""


def _build_prompt_default(rooms: list[dict]) -> str:
    room_list_str = "\n\n".join(_build_room_summary(r) for r in rooms)

    return f"""당신은 코리빙 주거 플랫폼의 AI 추천 전문가입니다.

[후보 방 목록]
{room_list_str}

[지시사항]
- 위 방들을 종합적으로 분석하여 이번 달 추천 Top3를 선정하세요.
- 방의 특장점(옵션·면적·위치·채광·월세·반려동물 여부)을 가장 중요하게 고려하세요.
- 평점·리뷰가 없는 신규 방도 조건이 좋으면 적극 추천하세요. 리뷰 유무로 차별하지 마세요.
- 각 방이 어떤 입주자에게 특히 어울리는지 관점에서 추천 이유를 작성하세요.
- 이유는 60~90자 한국어 2문장으로 작성하세요. 각 방마다 다른 관점(가격, 옵션, 채광, 위치, 면적 등)에서 차별화된 매력을 설명하세요. 3개 방의 이유가 비슷한 패턴이면 안 됩니다.

[출력 규칙]
반드시 순수 JSON 배열만 출력. 마크다운·코드블록 금지. 정확히 3개. room_id는 위 목록 값만 사용.

[출력 형식]
[{{"room_id":1,"rank":1,"reason":"60~90자 차별화된 이유","score":0.9}},{{"room_id":2,"rank":2,"reason":"60~90자 차별화된 이유","score":0.8}},{{"room_id":3,"rank":3,"reason":"60~90자 차별화된 이유","score":0.7}}]"""


# ── LLM 호출 ─────────────────────────────────────────────────────────────────

def _call_llm(prompt: str) -> str:
    provider = (settings.llm_provider or "openai").lower()

    if provider == "gemini":
        return _call_gemini(prompt)
    elif provider == "watsonx":
        return _call_watsonx(prompt)
    elif provider == "groq":
        return _call_openai_compatible(
            prompt,
            api_key=settings.groq_api_key,
            base_url=settings.groq_base_url,
            model=settings.groq_model,
        )
    else:
        return _call_openai_compatible(
            prompt,
            api_key=settings.openai_api_key,
            base_url=None,
            model=settings.openai_model,
        )


def _call_gemini(prompt: str) -> str:
    api_key = settings.gemini_api_key
    if not api_key:
        logger.warning("[RoomRecommend] Gemini API key 없음")
        return ""
    # 방 추천은 빠른 응답이 중요 → lite 모델 사용
    return _call_openai_compatible(
        prompt,
        api_key=api_key,
        base_url=settings.gemini_base_url,
        model="gemini-2.5-flash-lite",
    )


def _call_openai_compatible(
    prompt: str, api_key: str, base_url: str | None, model: str
) -> str:
    if not api_key:
        logger.warning("[RoomRecommend] API key 없음")
        return ""
    try:
        from openai import OpenAI
        kwargs: dict = {"api_key": api_key, "timeout": 60.0, "max_retries": 0}
        if base_url:
            kwargs["base_url"] = base_url
        client = OpenAI(**kwargs)
        resp = client.chat.completions.create(
            model=model,
            temperature=0.3,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = resp.choices[0].message.content or ""
        logger.info(f"[RoomRecommend] LLM RAW 응답: {raw_text[:300]}")  # ✅ 디버그 로그 추가
        return raw_text
    except Exception as e:
        logger.error(f"[RoomRecommend] LLM 호출 실패: {e}")
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
            params={"temperature": 0.3, "max_new_tokens": 2000},
        )
        return model.generate_text(prompt=prompt) or ""
    except Exception as e:
        logger.error(f"[RoomRecommend] Watsonx 호출 실패: {e}")
        return ""


# ── 결과 파싱 & 폴백 ─────────────────────────────────────────────────────────

def _fallback_top3(rooms: list[dict], user_query: str = "") -> list[dict]:
    scored = []
    query_lower = user_query.lower() if user_query else ""

    for r in rooms:
        stat_score = (
            float(r.get("avg_rating", 0)) * 0.2
            + float(r.get("review_count", 0)) * 0.01
            + float(r.get("contract_count", 0)) * 0.01
            + (1.0 if r.get("pet_allowed_yn") == "Y" else 0.0) * 0.1
            + (1.0 if r.get("sun_direction") == "s" else 0.0) * 0.1
        )

        keyword_bonus = 0.0
        if query_lower:
            room_text = " ".join([
                str(r.get("room_desc", "") or ""),
                str(r.get("room_options", "") or ""),
                ROOM_TYPE_KO.get(r.get("room_type", ""), ""),
                SUN_KO.get(r.get("sun_direction", ""), ""),
            ]).lower()
            matches = sum(1 for kw in query_lower.split() if kw in room_text)
            keyword_bonus = matches * 0.1

        scored.append((stat_score + keyword_bonus, r))

    scored.sort(key=lambda x: x[0], reverse=True)

    result = []
    for rank, (score, r) in enumerate(scored[:3], start=1):
        result.append({
            "room_id": r["room_id"],
            "rank":    rank,
            "reason":  "리뷰 평점과 계약 이력을 종합하여 선정된 추천 방입니다.",
            "score":   round(min(score / 5.0, 1.0), 2),
        })
    return result


def _parse_result(raw: str, rooms: list[dict], user_query: str = "") -> list[dict]:
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean).rstrip("`").strip()

        match = re.search(r"\[.*\]", clean, re.DOTALL)
        if match:
            result = json.loads(match.group())
            if isinstance(result, list) and len(result) >= 1:
                valid_ids = {r["room_id"] for r in rooms}
                seen_ids = set()
                validated = []
                for item in result:
                    rid = item.get("room_id")
                    if rid not in valid_ids or rid in seen_ids:
                        continue
                    seen_ids.add(rid)
                    validated.append({
                        "room_id": int(rid),
                        "rank":    len(validated) + 1,
                        "reason":  str(item.get("reason", "AI 분석 완료")),
                        "score":   float(item.get("score", 0.7)),
                    })
                if validated:
                    return validated
    except Exception as e:
        logger.warning(f"[RoomRecommend] JSON 파싱 실패: {e}, raw={raw[:200]}")

    logger.warning("[RoomRecommend] LLM 결과 없음 → 폴백 사용")
    return _fallback_top3(rooms, user_query)


# ── 메인 진입점 ──────────────────────────────────────────────────────────────

def recommend_rooms(payload: dict[str, Any]) -> list[dict]:
    rooms: list[dict] = payload.get("rooms", [])
    user_query: str = payload.get("user_query", "").strip()

    if not rooms:
        logger.warning("[RoomRecommend] 후보 방 목록이 비어있습니다.")
        return []

    if len(rooms) < 3:
        logger.warning("[RoomRecommend] 후보 방이 3개 미만(%d개). 폴백 사용.", len(rooms))
        return _fallback_top3(rooms, user_query)

    if user_query:
        # 사용자 쿼리에서 키워드 추출 → 조건 매칭 방을 우선 선별
        candidate_rooms = _prefilter_rooms(rooms, user_query)
        prompt = _build_prompt_personalized(candidate_rooms, user_query)
    else:
        candidate_rooms = rooms[:15]
        prompt = _build_prompt_default(candidate_rooms)

    raw    = _call_llm(prompt)
    result = _parse_result(raw, candidate_rooms, user_query)

    logger.info(
        "[RoomRecommend] 완료 (query=%s): %s",
        "있음" if user_query else "없음",
        result,
    )
    return result