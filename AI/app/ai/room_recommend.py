# 경로: app/ai/room_recommend.py
"""
방 추천 Top3 AI 로직 — 고도화 버전

[개선 사항]
1. 사용자 자연어 쿼리(query) 기반 개인화 추천
   - "조용한 원룸, 30만원대, 남향, 반려동물 가능" 같은 자연어를 이해
2. 2단계 파이프라인
   - Stage 1: BGE Embedding → Milvus 벡터 검색으로 의미 유사 방 필터링
   - Stage 2: LLM이 사용자 맥락에 맞춰 Top3 선정 + 개인화 이유 생성
3. 풍부한 방 데이터 활용
   - room_desc, room_options, sun_direction, capacity, pet_allowed_yn 등 포함
4. 고정 공식 제거
   - 더 이상 "평점 50%, 리뷰 30%, 계약 20%" 같은 공식을 LLM에 주입하지 않음
   - LLM이 사용자 쿼리 맥락에 따라 가중치를 스스로 판단
5. Gemini 지원 추가

Request (from Java):
{
  "rooms": [
    {
      "room_id": 1,
      "building_nm": "강남 코리빙",
      "building_addr": "서울시 강남구 ...",
      "room_type": "one_room",
      "floor": 3,
      "room_size": 16.5,
      "rent_price": 500000,
      "manage_fee": 80000,
      "deposit": 1000000,
      "rent_min": 3,
      "sun_direction": "s",
      "pet_allowed_yn": "Y",
      "room_capacity": 1,
      "room_options": "에어컨,세탁기,냉장고",
      "room_desc": "채광이 좋은 남향 원룸입니다...",
      "avg_rating": 4.5,
      "review_count": 12,
      "contract_count": 8
    },
    ...
  ],
  "user_query": "조용하고 채광 좋은 원룸, 월세 50만원 이하"   ← 선택 (없으면 기본 추천)
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

# ── 상수 ──────────────────────────────────────────────────────────────────────

ROOM_TYPE_KO = {
    "one_room":   "원룸",
    "two_room":   "투룸",
    "three_room": "쓰리룸",
    "loft":       "복층",
    "share":      "쉐어룸",
}

SUN_KO = {"n": "북향", "s": "남향", "e": "동향", "w": "서향"}

MILVUS_COLLECTION = "room_descriptions"


# ── Stage 1: Milvus 벡터 검색 ─────────────────────────────────────────────────

def _get_embedding(text: str) -> list[float] | None:
    """
    BGE 또는 OpenAI Embedding으로 텍스트를 벡터(숫자 배열)로 변환.
    벡터(Vector) = 텍스트의 의미를 숫자로 표현한 것.
    """
    provider = (settings.embedding_provider or "bge").lower()
    try:
        if provider == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=settings.openai_api_key)
            resp = client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return resp.data[0].embedding

        else:  # bge (FlagEmbedding 또는 sentence-transformers)
            try:
                from FlagEmbedding import FlagModel
                model = FlagModel(
                    "BAAI/bge-m3",
                    use_fp16=True,
                    query_instruction_for_retrieval="Represent this sentence for searching relevant passages: ",
                )
                return model.encode([text])[0].tolist()
            except ImportError:
                # FlagEmbedding 없으면 sentence-transformers로 폴백
                from sentence_transformers import SentenceTransformer
                model = SentenceTransformer("BAAI/bge-m3")
                return model.encode([text])[0].tolist()

    except Exception as e:
        logger.warning(f"[Embed] 임베딩 실패: {e}")
        return None


def _milvus_search(query: str, candidate_ids: list[int]) -> list[int]:
    """
    Milvus(벡터 DB)에서 사용자 쿼리와 의미적으로 유사한 방 ID를 반환.
    
    - 쿼리를 벡터로 변환
    - Milvus에서 코사인 유사도(Cosine Similarity — 두 벡터의 방향이 얼마나 비슷한지)로 검색
    - 후보 방 중에서만 필터링
    """
    try:
        from pymilvus import MilvusClient

        query_vec = _get_embedding(query)
        if query_vec is None:
            return candidate_ids  # 임베딩 실패 시 전체 후보 반환

        client = MilvusClient(
            uri=settings.milvus_uri,
            token=settings.milvus_token or "",
        )

        # 후보 방 ID로 필터링하여 벡터 검색
        id_filter = f"room_id in {candidate_ids}" if candidate_ids else ""

        results = client.search(
            collection_name=MILVUS_COLLECTION,
            data=[query_vec],
            filter=id_filter,
            limit=min(settings.top_k or 10, len(candidate_ids)),
            output_fields=["room_id"],
            search_params={"metric_type": "COSINE"},
        )

        if results and results[0]:
            return [hit["entity"]["room_id"] for hit in results[0]]

        return candidate_ids

    except Exception as e:
        logger.warning(f"[Milvus] 벡터 검색 실패, 전체 후보 사용: {e}")
        return candidate_ids


# ── Stage 2: LLM 프롬프트 구성 ───────────────────────────────────────────────

def _build_room_summary(r: dict) -> str:
    """방 하나를 LLM이 이해하기 쉬운 텍스트로 변환."""
    room_type_ko = ROOM_TYPE_KO.get(r.get("room_type", ""), r.get("room_type", "-"))
    sun = SUN_KO.get(r.get("sun_direction", ""), "-")
    pet = "가능" if r.get("pet_allowed_yn") == "Y" else "불가"
    options = r.get("room_options", "") or "-"
    desc = r.get("room_desc", "") or ""
    # room_desc가 길면 100자로 자름
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
    """사용자 쿼리가 있을 때: 개인화 추천 프롬프트."""
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
- 이유는 "~때문에", "~으로" 같은 구체적 근거를 포함한 2문장 이내 한국어로 작성하세요.

[출력 규칙]
- 반드시 순수 JSON 배열만 출력하세요. 마크다운 없이.
- 정확히 3개 항목, rank는 1·2·3.
- score는 0.0~1.0 소수점 2자리.
- room_id는 위 목록에 있는 값만 사용.

[출력 형식]
[
  {{"room_id": 1, "rank": 1, "reason": "남향 채광과 반려동물 허용 조건을 모두 충족하며, 평점 4.8점으로 입주자 만족도가 검증된 방입니다.", "score": 0.91}},
  {{"room_id": 3, "rank": 2, "reason": "요청하신 월세 범위 내에서 에어컨·세탁기 옵션이 완비되어 추가 지출 없이 입주 가능합니다.", "score": 0.78}},
  {{"room_id": 5, "rank": 3, "reason": "조용한 북향 배치와 넓은 면적으로 재택근무 환경에 적합합니다.", "score": 0.65}}
]"""


def _build_prompt_default(rooms: list[dict]) -> str:
    """사용자 쿼리 없을 때: 종합 평가 기반 추천 프롬프트."""
    room_list_str = "\n\n".join(_build_room_summary(r) for r in rooms)

    return f"""당신은 코리빙 주거 플랫폼의 AI 추천 전문가입니다.

[후보 방 목록]
{room_list_str}

[지시사항]
- 위 방들을 종합적으로 분석하여 이번 달 추천 Top3를 선정하세요.
- 방의 특장점(옵션·면적·위치·채광·월세·반려동물 여부)을 가장 중요하게 고려하세요.
- 평점·리뷰가 없는 신규 방도 조건이 좋으면 적극 추천하세요. 리뷰 유무로 차별하지 마세요.
- 각 방이 어떤 입주자에게 특히 어울리는지 관점에서 추천 이유를 작성하세요.
- 이유는 방의 구체적 특징(옵션, 채광, 월세 등)을 언급한 2문장 이내 한국어로 작성하세요.

[출력 규칙]
- 반드시 순수 JSON 배열만 출력하세요. 마크다운 없이.
- 정확히 3개 항목, rank는 1·2·3.
- score는 0.0~1.0 소수점 2자리.
- room_id는 위 목록에 있는 값만 사용.

[출력 형식]
[
  {{"room_id": 1, "rank": 1, "reason": "리뷰 12건 평점 4.8의 압도적 만족도와 남향 채광이 결합된 프리미엄 원룸으로, 쾌적한 주거를 원하는 1인 가구에게 최적입니다.", "score": 0.91}},
  {{"room_id": 3, "rank": 2, "reason": "반려동물 허용에 에어컨·세탁기·냉장고가 모두 갖춰져 추가 비용 없이 즉시 입주 가능한 실속형 방입니다.", "score": 0.78}},
  {{"room_id": 5, "rank": 3, "reason": "장기 계약 이력 8건으로 검증된 안정적인 환경과 합리적인 월세가 균형을 이루는 방입니다.", "score": 0.65}}
]"""


# ── LLM 호출 (provider 자동 선택) ─────────────────────────────────────────────

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
    else:  # openai 기본값
        return _call_openai_compatible(
            prompt,
            api_key=settings.openai_api_key,
            base_url=None,
            model=settings.openai_model,
        )


def _call_gemini(prompt: str) -> str:
    """Google Gemini API 호출."""
    if not settings.gemini_api_key:
        logger.warning("[RoomRecommend] Gemini API key 없음")
        return ""
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=settings.gemini_api_key)
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2000,
                thinking_config=types.ThinkingConfig(
                    thinking_budget=0,   # ← thinking 비활성화
                ),
            ),
        )
        text = resp.text or ""
        logger.info(f"[Gemini 응답 RAW 전체]: {text}")
        return text
    except Exception as e:
        logger.error(f"[RoomRecommend] Gemini 호출 실패: {e}")
        return ""

def _call_openai_compatible(
    prompt: str, api_key: str, base_url: str | None, model: str
) -> str:
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
            temperature=0.3,
            max_tokens=600,
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
            params={"temperature": 0.3, "max_new_tokens": 600},
        )
        return model.generate_text(prompt=prompt) or ""
    except Exception as e:
        logger.error(f"[RoomRecommend] Watsonx 호출 실패: {e}")
        return ""


# ── 결과 파싱 & 폴백 ─────────────────────────────────────────────────────────

def _fallback_top3(rooms: list[dict], user_query: str = "") -> list[dict]:
    """
    LLM 실패 시 통계 기반 폴백.
    user_query가 있으면 간단한 키워드 매칭 점수를 추가.
    """
    scored = []
    query_lower = user_query.lower() if user_query else ""

    for r in rooms:
        # 기본 통계 점수 (평점 비중 낮춤, 방 특징 기반으로)
        stat_score = (
            float(r.get("avg_rating", 0)) * 0.2      # 평점 비중 축소
            + float(r.get("review_count", 0)) * 0.01
            + float(r.get("contract_count", 0)) * 0.01
            + (1.0 if r.get("pet_allowed_yn") == "Y" else 0.0) * 0.1  # 반려동물 보너스
            + (1.0 if r.get("sun_direction") == "s" else 0.0) * 0.1   # 남향 보너스
        )

        # 쿼리 키워드 매칭 보너스
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
    """LLM 응답 JSON 파싱. 실패 시 폴백."""
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean).rstrip("`").strip()

        match = re.search(r"\[.*\]", clean, re.DOTALL)
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
    return _fallback_top3(rooms, user_query)


# ── 메인 진입점 ──────────────────────────────────────────────────────────────

async def recommend_rooms(payload: dict[str, Any]) -> list[dict]:
    """
    메인 진입점 — routes_ai_rest.py 에서 호출됩니다.

    Args:
        payload: {
            "rooms": [...],           # 후보 방 목록 (필수)
            "user_query": "..."       # 사용자 자연어 요청 (선택)
        }
    Returns:
        [{"room_id": int, "rank": int, "reason": str, "score": float}, ...]
    """
    rooms: list[dict] = payload.get("rooms", [])
    user_query: str = payload.get("user_query", "").strip()

    if not rooms:
        logger.warning("[RoomRecommend] 후보 방 목록이 비어있습니다.")
        return []

    if len(rooms) < 3:
        logger.warning("[RoomRecommend] 후보 방이 3개 미만(%d개). 폴백 사용.", len(rooms))
        return _fallback_top3(rooms, user_query)

    # ── Stage 1: 사용자 쿼리가 있으면 Milvus 벡터 검색으로 후보 압축 ──────────
    candidate_rooms = rooms
    if user_query:
        logger.info("[RoomRecommend] 벡터 검색 시작: query='%s'", user_query)
        candidate_ids = [r["room_id"] for r in rooms]
        ranked_ids = _milvus_search(user_query, candidate_ids)

        # 벡터 검색 결과 순서로 재정렬, 검색된 것 우선 (최소 3개 보장)
        id_order = {rid: i for i, rid in enumerate(ranked_ids)}
        candidate_rooms = sorted(
            rooms,
            key=lambda r: id_order.get(r["room_id"], len(ranked_ids)),
        )
        # 최대 10개로 LLM 입력 제한 (비용·속도 최적화)
        candidate_rooms = candidate_rooms[:10]
        logger.info(
            "[RoomRecommend] 벡터 검색 후 후보: %d개 → %d개",
            len(rooms), len(candidate_rooms),
        )

    # ── Stage 2: LLM 추천 ────────────────────────────────────────────────────
    if user_query:
        prompt = _build_prompt_personalized(candidate_rooms, user_query)
    else:
        prompt = _build_prompt_default(candidate_rooms)

    raw    = _call_llm(prompt)
    result = _parse_result(raw, candidate_rooms, user_query)

    logger.info(
        "[RoomRecommend] 완료 (query=%s): %s",
        "있음" if user_query else "없음",
        result,
    )
    return result