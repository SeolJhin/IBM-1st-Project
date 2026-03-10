# app/services/orchestrator/intent_classifier.py
import json
import logging
import re

from openai import OpenAI
from app.config.settings import settings

logger = logging.getLogger(__name__)

INTENT_DESCRIPTIONS = {
    "BUILDING_LIST":               "빌딩/건물 전체 목록, 어떤 빌딩이 있는지, 빌딩 종류·주소·개수",
    "ROOM_AVAILABILITY_SEARCH":    "입주 가능한 방 탐색, 빈 방 구하기, 월세/보증금/원룸/투룸/반려동물/평수/인원 조건으로 방 검색",
    "CONTRACT_RENEWAL_RECOMMEND":  "계약 만료·갱신·연장·재계약, 계약 만료 예정자에게 맞는 방 추천",
    "COMMON_SPACE_RECOMMEND":      "공용공간·회의실·헬스장·세탁실·라운지 예약 추천",
    "PAYMENT_STATUS_SUMMARY":      "결제·납부·청구·월세 납부·관리비·영수증 현황",
    "PAYMENT_SUMMARY_DOCUMENT":    "결제 내역 문서·상세 정산 요청",
    "ROOMSERVICE_STOCK_MONITOR":   "룸서비스·청소·수건·린넨·비품 재고 현황",
    "COMPLAIN_PRIORITY_CLASSIFY":  "민원·불편사항·소음·하자·수리 신고",
    "REVIEW_INFO":                 "리뷰·후기·별점·평점·만족도",
    "TOUR_INFO":                   "투어·견학·방문·현장 확인 일반 안내 (내 예약 아님)",
    "COMPANY_INFO":                "회사 정보·대표·전화·이메일·주소·고객센터 문의",
    "MY_CONTRACT":                 "내 계약 확인·조회·내 월세·보증금·납부일 (로그인 필요)",
    "MY_RESERVATION":              "내 공용시설 예약 내역·예약 확인·예약 현황 (로그인 필요)",
    "MY_TOUR":                     "내 투어 예약 확인·조회·투어 내역 (로그인 필요)",
    "MY_COMPLAIN":                 "내 민원 현황·접수 확인·민원 내역 (로그인 필요)",
    "COMMUNITY_CONTENT_SEARCH":    "커뮤니티 게시판·공지·FAQ 검색",
    "GENERAL_QA":                  "위 항목에 해당하지 않는 일반 질문·서비스 안내",
}

_INTENT_LIST = "\n".join(f'- "{k}": {v}' for k, v in INTENT_DESCRIPTIONS.items())

_SYSTEM_PROMPT = f"""당신은 UNI PLACE 주거 플랫폼의 AI intent 분류 및 조건 추출기입니다.
사용자의 질문을 읽고 아래 형식의 JSON을 반환하세요.

[Intent 목록]
{_INTENT_LIST}

[반환 형식]
{{
  "intent": "INTENT_NAME",
  "slots": {{

    // ── 공통 정렬/제한 (어느 intent에서나 사용 가능) ──
    "sort_by": "rating",          // 정렬 기준 컬럼명 (아래 도메인별 참고)
    "sort_order": "desc",         // "asc" 또는 "desc"
    "limit": 5,                   // 상위 N개 (예: "가장 높은 1개", "상위 3개")

    // ── REVIEW_INFO 조건 ──
    // sort_by 가능값: "rating"(별점), "read_count"(조회수), "like_count"(좋아요), "created_at"(최신)
    "room_id": 101,               // 특정 방 ID
    "building_nm": "A빌딩",       // 특정 빌딩 이름 포함 검색
    "min_rating": 4,              // 최소 별점 (예: "4점 이상")
    "max_rating": 5,              // 최대 별점

    // ── ROOM_AVAILABILITY_SEARCH 조건 ──
    // sort_by 가능값: "rent_price"(월세), "room_size"(평수), "floor"(층), "rating"(평점순)
    "pet_allowed_yn": "Y",        // 반려동물 허용: 강아지·고양이·펫 언급 시 "Y"
    "max_rent_price": 600000,     // 최대 월세 (숫자만, "60만원 이하" → 600000)
    "min_rent_price": 300000,     // 최소 월세
    "room_capacity": 2,           // 인원 수
    "room_type": "one_room",      // one_room / two_room / three_room / loft / share
    "min_parking_capacity": 1,    // 주차 필요 시 1
    "min_room_size": 10.0,        // 최소 평수
    "max_room_size": 30.0,        // 최대 평수
    "floor": 3,                   // 특정 층

    // ── BUILDING_LIST 조건 ──
    // sort_by 가능값: "building_nm"(이름), "parking_capacity"(주차), "build_size"(규모)
    "elv_filter": "Y",            // 엘리베이터 있는 건물: "Y" / 없는 건물: "N"
    "keyword": "강남",            // 지역/이름 키워드

    // ── MY_CONTRACT 조건 ──
    // sort_by 가능값: "contract_end"(만료일), "rent_price"(월세), "contract_start"(시작일)
    "contract_st": "in_progress", // 계약 상태 필터 (in_progress / completed / terminated)

    // ── MY_COMPLAIN / COMPLAIN_PRIORITY_CLASSIFY 조건 ──
    // sort_by 가능값: "created_at"(최신), "importance"(중요도)
    "comp_st": "received",        // 민원 상태 (received / in_progress / resolved)
    "importance": "high",         // 중요도 (high / medium / low)
    "comp_keyword": "소음",       // 민원 제목/내용 검색어

    // ── MY_RESERVATION / COMMON_SPACE_RECOMMEND 조건 ──
    // sort_by 가능값: "sr_start_at"(예약일)
    "space_nm": "헬스장",         // 공간 이름
    "sr_st": "confirmed",         // 예약 상태 (confirmed / cancelled / pending)

    // ── MY_TOUR 조건 ──
    // sort_by 가능값: "tour_start_at"(투어일)
    "tour_st": "confirmed",       // 투어 상태 (confirmed / cancelled / pending)

    // ── PAYMENT_STATUS_SUMMARY 조건 ──
    // sort_by 가능값: "paid_at"(결제일), "total_price"(금액)
    "payment_st": "paid",         // 결제 상태 (paid / ready / cancelled)
    "month": "2025-03",           // 특정 월 (YYYY-MM)

    // ── ROOMSERVICE_STOCK_MONITOR 조건 ──
    // sort_by 가능값: "prod_stock"(재고), "prod_nm"(이름)
    "prod_nm": "수건",            // 상품명 검색
    "building_id": 1              // 특정 빌딩 ID
  }}
}}

규칙:
- slots는 질문에서 명시적으로 언급된 조건만 포함 (없으면 생략)
- "가장 높은/낮은", "상위 N개", "최신순", "오래된" 등 → sort_by + sort_order + limit 추출
- "평점 가장 높은" → sort_by: "rating", sort_order: "desc"
- "월세 낮은 순" → sort_by: "rent_price", sort_order: "asc"
- "최신 리뷰" → sort_by: "created_at", sort_order: "desc"
- "조회수 많은" → sort_by: "read_count", sort_order: "desc"
- "만료 임박" → sort_by: "contract_end", sort_order: "asc"
- 반려동물(강아지·고양이·애완동물·펫) 언급 → pet_allowed_yn: "Y"
- 숫자+만원 → 숫자*10000 변환 (예: 60만원 → 600000)
- 다른 설명, 주석, 마크다운 절대 포함 금지"""


def classify_intent(prompt: str, history: list[dict] | None = None) -> str:
    result = classify_intent_with_slots(prompt, history)
    return result[0]


def classify_intent_with_slots(prompt: str, history: list[dict] | None = None) -> tuple[str, dict]:
    if not prompt or not prompt.strip():
        return "GENERAL_QA", {}

    context = ""
    if history:
        recent = history[-4:]
        if recent:
            context = "\n[최근 대화]\n" + "\n".join(
                f"{m.get('role','')}: {m.get('content','')[:120]}" for m in recent
            )

    user_content = f"{context}\n\n[현재 질문]\n{prompt.strip()}"

    api_key = settings.groq_api_key
    if not api_key:
        logger.warning("[IntentClassifier] GROQ_API_KEY 미설정")
        return "GENERAL_QA", {}

    try:
        client = OpenAI(api_key=api_key, base_url=settings.groq_base_url, timeout=10.0)
        response = client.chat.completions.create(
            model=settings.groq_model,
            temperature=0.0,
            max_tokens=300,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_content},
            ],
        )
        raw = response.choices[0].message.content or ""
        return _parse_result(raw.strip())
    except Exception as exc:
        logger.warning("[IntentClassifier] LLM 호출 실패: %s", exc.__class__.__name__)
        return "GENERAL_QA", {}


def _parse_result(raw: str) -> tuple[str, dict]:
    valid = set(INTENT_DESCRIPTIONS.keys())
    try:
        json_str = re.search(r"\{.*\}", raw, re.DOTALL)
        if json_str:
            data = json.loads(json_str.group())
            intent = str(data.get("intent", "")).strip().upper()
            slots  = data.get("slots", {}) or {}
            if intent in valid:
                logger.info("[IntentClassifier] 분류 성공: intent=%s slots=%s", intent, slots)
                return intent, slots
    except (json.JSONDecodeError, AttributeError):
        pass

    raw_upper = raw.upper()
    for intent in valid:
        if intent in raw_upper:
            logger.warning("[IntentClassifier] 폴백 분류: %s", intent)
            return intent, {}

    logger.warning("[IntentClassifier] 분류 실패 (raw=%r)", raw[:100])
    return "GENERAL_QA", {}