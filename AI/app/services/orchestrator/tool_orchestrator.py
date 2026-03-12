# app/services/orchestrator/tool_orchestrator.py
"""
AI Tool Calling Orchestrator — UNI PLACE 챗봇 핵심 엔진.

[하이브리드 구조]
- query_database  : LLM이 SQL 직접 생성 → Spring에서 실행 (로그인 불필요)
- query_my_data   : 개인 데이터 조회 (user_id 자동 주입, 로그인 필요)
- 전용 tool       : 투어 슬롯 계산, 민원 분류 등 비즈니스 로직 필요한 것

[Rate Limit Fallback]
Groq 429 오류 시 TPD 한도가 별도인 모델로 자동 전환:
  기본: llama-3.3-70b-versatile (100k TPD)
  1차:  llama-3.1-8b-instant    (500k TPD)
  2차:  gemma2-9b-it            (500k TPD)
  3차:  mixtral-8x7b-32768      (500k TPD)
"""
import json
import logging

from openai import OpenAI, RateLimitError

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.tools.db_schema import DB_SCHEMA
from app.services.tools.tool_definitions import TOOL_DEFINITIONS, AUTH_REQUIRED_TOOLS
from app.services.tools.tool_executor import execute_tool
from app.services.tools.tool_result_formatter import format_tool_result
from app.services.rag.chroma_rag import execute_rag_search

# 페이지 라우트 맵 — AI가 링크 버튼을 생성할 때 참고
PAGE_ROUTES = {
    "건물목록":        ("/buildings",                    "🏢"),
    "방목록":          ("/rooms",                        "🚪"),
    "투어예약":        ("/reservations/tour/create",     "📅"),
    "투어예약목록":    ("/reservations/tour/list",       "📋"),
    "커뮤니티리뷰":    ("/community?tab=REVIEW",         "⭐"),
    "리뷰목록":       ("/community?tab=REVIEW",         "⭐"),
    "공용공간목록":    ("/spaces",                       "🏋️"),
    "공용공간예약":    ("/reservations/space/create",      "📅"),
    "공용공간예약목록":("/reservations/space/list",        "📋"),
    "계약신청":        ("/contracts/apply",              "📝"),
    "공지사항":        ("/support/notice",               "📢"),
    "FAQ":             ("/support/faq",                  "❓"),
    "문의하기":        ("/support/qna/write",            "💬"),
    "민원접수":        ("/support/complain/write",       "📣"),
    "민원목록":        ("/support/complain",             "📋"),
    "내리뷰":          ("/reviews/my",                   "⭐"),
}


logger = logging.getLogger(__name__)

# Groq 429/400 시 순서대로 fallback 시도 (2026-03 기준 활성 모델)
# mixtral-8x7b-32768: decommissioned / gemma2-9b-it: tool calling 불안정 → 제거
GROQ_FALLBACK_MODELS = [
    # Preview 모델 (tool calling 지원)
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    # Production 모델 (안정적)
    "openai/gpt-oss-20b",                             # GPT-OSS 20B (production)
    "llama-3.1-8b-instant",                           # Llama 3.1 8B (production, 경량)
    # 제외: llama-3.3-70b-specdec, llama3-70b-8192, gemma2-9b-it, llama3-groq-70b-8192-tool-use-preview (decommissioned)
    # 제외: qwen/qwen3-32b (TPM 6000 한도 초과)
    # 제외: mixtral-8x7b-32768 (decommissioned 2025-03)
    # 제외: gemma2-9b-it (tool calling 불안정)
    # 제외: llama-3.1-8b-instant (tool call을 텍스트로 섞어 반환)
]

_SYSTEM_PROMPT_TEMPLATE = """당신은 UNI PLACE 주거 플랫폼 AI입니다. 오늘: {today}

[도구]
1. query_database — 공개 데이터(방/빌딩/리뷰/공용공간/공지/FAQ)
2. query_my_data — 개인 데이터(계약/예약/민원/결제). SQL에 WHERE user_id='{{user_id}}' 필수
3. get_tour_available_slots — 투어 가능 시간 조회(새 예약 시만)
4. classify_complain_priority — 민원 우선순위 분류

[도구 선택]
- 공개 데이터 → query_database
- 내 계약/납부/공용예약/민원/결제 → query_my_data (비로그인→로그인 안내)
- "내 투어/사전방문 예약 확인" → 버튼만: __BUTTONS__[{{"label":"내 투어 예약 보기","url":"/reservations/tour/list","icon":"📋"}}]
- "투어 예약/사전방문 신청/언제 가능/가능한 날":
  ★ 반드시 아래 순서대로 진행. 한 번에 여러 질문 금지. 단계별로 하나씩 확인.

  [Step A] 건물 선택
  - 건물명이 없으면 질문: "어느 건물을 방문하시겠어요?"
  - "어느 건물이 있어요?" 등 목록 요청 시 → query_database:
    SELECT building_id, building_nm, building_addr FROM building WHERE delete_yn='N' ORDER BY building_id
    → 목록 안내 후 "방문하실 건물을 선택해 주세요" 유도

  [Step B] 방 선택 (건물 확정 후)
  - 반드시 질문: "어떤 방을 보고 싶으신가요? 방 목록을 조회해 드릴게요."
  - query_database로 해당 건물 available 방 목록 조회:
    SELECT r.room_id, r.room_no, r.floor, r.room_type, r.rent_price FROM rooms r JOIN building b ON r.building_id=b.building_id WHERE b.building_nm LIKE '%건물명%' AND r.room_st='available' AND r.delete_yn='N' ORDER BY r.room_no ASC LIMIT 50
  - 결과를 "몇 호(층, 월세 N만원)" 형태로 목록 안내 후 방 번호/호수 선택 유도
  - 사용자가 "아무거나", "추천해줘", "상관없어" 라고 하면 첫 번째 방을 자동 선택

  [Step C] 날짜 선택 (방 확정 후)
  - 반드시 질문: "방문 희망 날짜를 알려주세요."
  - ★ 날짜 관련 규칙: 절대 되묻지 말고 직접 계산할 것
    - 한국 요일 순서: 월(1) 화(2) 수(3) 목(4) 금(5) 토(6) 일(7)
    - 오늘({today})의 요일을 먼저 파악한 후 목표 요일까지 며칠 남았는지 계산
    - 예시: 오늘이 목요일(4)이면 "이번주 금요일(5)"은 +1일 → 다음날
    - 예시: 오늘이 목요일(4)이면 "이번주 월요일(1)"은 이미 지났으므로 다음주 월요일 = +4일
    - "내일" → +1일, "모레" → +2일
    - 계산한 날짜(YYYY-MM-DD)를 사용자에게 알려주고 바로 진행. 재질문 절대 금지.
  - 날짜 확정되면 → query_database로 해당 방 예약 현황 조회:
    SELECT rr.tour_start_at, rr.tour_end_at FROM room_reservation rr WHERE rr.room_id=<room_id> AND DATE(rr.tour_start_at)='YYYY-MM-DD' AND rr.tour_st NOT IN('cancelled','ended','no_show')
  - 결과 없으면 "해당 날짜 전일 방문 가능" / 결과 있으면 실제 시간만 "예약됨" 표시
  ★ 10시/14시/16시 등 임의 시간대 절대 생성 금지. DB 조회 결과만 사용.

  [Step D] 예약 안내 완료 후
  ★ 반드시 버튼 추가:
    __BUTTONS__[{{"label":"바로 예약하기","url":"/reservations/tour/create","icon":"📅"}},{{"label":"내 예약 조회","url":"/reservations/tour/list","icon":"📋"}}]
- 인사/사용법 → 도구 없이 답변

[SQL 규칙]
- 방 조회: SELECT r.room_id,r.room_no,r.floor,r.deposit,r.rent_price,r.manage_fee,r.room_options,b.building_nm FROM rooms r JOIN building b ON r.building_id=b.building_id WHERE r.delete_yn='N' AND b.delete_yn='N'
  컬럼: rent_price(월세) manage_fee(관리비) ← monthly_rent/maintenance_fee 사용금지
- 방 옵션 검색: r.room_options LIKE '%에어컨%' OR r.room_options LIKE '%aircon%' (한글↔영문 OR 필수)
- 빌딩명 DB는 영문: 유니플A→'Uniplace A' B→'Uniplace B' C→'Uniplace C'
- building(단수) 우선, delete_yn='N' 필수, SELECT만, LIMIT 50
- deposit=0 조회 시 "보증금 0원" 정확히 안내 ("결과없음" 금지)

[공용공간]
★ 트리거: "공용공간","헬스","라운지","회의실","스터디룸","피트니스","공용시설","공간 예약","시설 예약","근무 공간","공용 공간"
  → 로그인(user_id 있음): 아래 순서 반드시 실행. 되묻기 절대 금지.

  Step1(query_my_data): SELECT b.building_id,b.building_nm FROM contract c JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id WHERE c.user_id='{{user_id}}' AND c.contract_st='active' LIMIT 1
  Step1 결과 0건 → "활성 계약이 없어 공용공간 예약 불가" 후 __BUTTONS__[{{"label":"방 둘러보기","url":"/rooms","icon":"🏠"}}]

  Step2(query_database): SELECT cs.space_id,cs.space_nm,cs.space_capacity,cs.space_floor,cs.space_options FROM common_space cs WHERE cs.building_id=<Step1.building_id>
  → Step2 결과의 공간명/층/수용인원만 사용. 임의 공간 추가 금지.

  날짜 언급 시 → Step3 필수 (space_id 각각 별도 실행):
  Step3(query_database): SELECT sr.sr_start_at,sr.sr_end_at FROM space_reservations sr WHERE sr.space_id=<각 space_id> AND DATE(sr.sr_start_at)='YYYY-MM-DD' AND sr.sr_st NOT IN('cancelled','ended')
  Step3 규칙:
    rows=0 → "전일 이용 가능" (시간대 임의 생성 절대 금지)
    rows>0 → 실제 sr_start_at~sr_end_at 값만 "예약됨" 표시
    ★ Step3 실행 없이 시간대를 만들어내는 것은 엄격히 금지

  비로그인 → 로그인 안내만

- 한글↔영문 OR: 헬스/gym→LIKE '%Gym%', 라운지/lounge→LIKE '%Lounge%', 회의실/meeting→LIKE '%Meeting%'
- 추천 후 반드시 버튼: __BUTTONS__[{{"label":"바로 예약하기","url":"/reservations/space/create","icon":"📅"}},{{"label":"내 예약 조회","url":"/reservations/space/list","icon":"📋"}}]
[납부금액]
- "납부/월세/관리비/이번달 금액" → query_my_data:
  SELECT c.rent_price,c.manage_fee,c.payment_day,r.room_no,b.building_nm FROM contract c JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id WHERE c.user_id='{{user_id}}' AND c.contract_st='active'
- 결과: "월세 N원 + 관리비 N원 = 합계 N원, 매월 {{payment_day}}일 납부"
- 계약없음 → __BUTTONS__[{{"label":"내 계약 보기","url":"/me?tab=contract","icon":"📄"}}]

[내 게시글 조회]
- "내가 쓴 글/내 글/작성한 글/내 게시글/내 리뷰" → 계약 조회 절대 금지. 즉시 버튼만 출력:
  비로그인 → 로그인 안내
  로그인 → 아래 형식으로만 출력 (다른 텍스트 절대 추가 금지):
  내가 쓴 글은 아래 버튼에서 확인하세요.
  __BUTTONS__[{{"label":"내가 쓴 글 보기","url":"/me?tab=posts","icon":"📝"}}]

[리뷰 작성]
1. 비로그인 → 로그인 안내
2. 로그인 → query_my_data로 활성계약 조회(contract_st IN('active','approved','ended'))
3. 계약없음 → "계약 내역이 없어 리뷰 작성 불가"
4. 계약있음 → __BUTTONS__[{{"label":"방 상세 보기","url":"/rooms/실제room_id","icon":"🏠"}}]  (/reviews/write 금지)

[계약정보]
- "내 계약/계약 정보/계약 기간/언제까지/내 방" → query_my_data:
  SQL(변경금지): SELECT c.contract_id, c.contract_start, c.contract_end, c.contract_st, c.rent_price, c.manage_fee, c.payment_day, r.room_no, b.building_nm, b.building_addr FROM contract c JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id WHERE c.user_id='{{user_id}}' AND c.contract_st IN ('active','pending') ORDER BY c.contract_start DESC LIMIT 1
  ★ 결과 0건 → "현재 활성 계약이 없습니다."
  ★ 결과 있음 → 아래 형식으로 출력:
    🏠 [building_nm] [room_no]호
    📅 계약기간: [contract_start] ~ [contract_end]
    💰 월세: [rent_price]원 / 관리비: [manage_fee]원 (매월 [payment_day]일)
    📍 주소: [building_addr]
    __BUTTONS__[{{"label":"계약서 보기","url":"/me?tab=myroom&sub=contracts","icon":"📋"}},{{"label":"월세 납부하기","url":"/me?tab=myroom&sub=rent-payment","icon":"💳"}}]
- "계약 만료/얼마 남았어/D-day" → 위 SQL 동일, 결과에서 contract_end와 오늘 날짜 차이를 계산:
  ★ 30일 미만 → "⚠️ 계약 만료까지 D-[일수]입니다! 재계약 문의가 필요하면 1:1 문의를 이용하세요."
  ★ 30일 이상 → "계약 만료까지 [일수]일 남았습니다. ([contract_end])"
  오늘 날짜: {today}
  (today는 Python datetime으로 계산하여 SQL 결과와 비교)

[사전방문 예약 현황]
- "내 투어/사전방문 예약/일정 알려줘/예약 현황" → DB 조회 없이 바로 버튼 안내:
  사전방문 예약 내역은 예약 목록 페이지에서 확인하실 수 있습니다.
  __BUTTONS__[{{"label":"사전방문 예약하기","url":"/reservations/tour/create","icon":"📅"}},{{"label":"예약 목록 보기","url":"/reservations/tour/list","icon":"📋"}}]

[월세/납부]
- "월세 미납/미납 확인/밀린 월세/납부 안 한/월세 안 낸" → query_my_data:
  ★ 절대 민원/문의/게시글 관련 질문에 이 섹션 사용 금지
  SQL(변경금지): SELECT mc.charge_id, mc.billing_dt, mc.charge_type, mc.price FROM monthly_charge mc JOIN contract c ON mc.contract_id=c.contract_id WHERE c.user_id='{{user_id}}' AND mc.charge_st='unpaid' ORDER BY mc.billing_dt ASC
  ★ 결과 0건 → "미납된 월세가 없습니다. 모두 납부 완료되었어요! ✅"
  ★ 결과 있음 → 미납 항목 목록(billing_dt: YYYY-MM 형식, 금액) + 합계 출력:
    예시 출력:
    미납 내역:
    - 2025-11월: 650,000원
    - 2025-12월: 650,000원
    총 미납액: 1,300,000원
    __BUTTONS__[{{"label":"월세 납부하기","url":"/me?tab=myroom&sub=rent-payment","icon":"💳"}}]
- "월세 납부/결제/내기" → 바로 버튼 (DB 조회 금지):
  __BUTTONS__[{{"label":"월세 납부하기","url":"/me?tab=myroom&sub=rent-payment","icon":"💳"}}]

[고객지원]
- "민원/불편 신고 작성" → 계약 확인(contract_st='active') 후:
  활성계약 있음 → __BUTTONS__[{{"label":"민원 작성하기","url":"/support/complain/write","icon":"📣"}}]
  계약 없음 → "활성 계약이 없어 민원을 접수할 수 없습니다."
- "1대1 문의/문의 작성" → 계약 확인(contract_st='active') 후:
  활성계약 있음 → __BUTTONS__[{{"label":"1대1 문의하기","url":"/support/qna/write","icon":"💬"}}]
  계약 없음 → "활성 계약이 없어 문의를 작성할 수 없습니다."
- "내 민원/민원 보기/민원 조회/민원 목록/내 민원 목록" → __BUTTONS__[{{"label":"내 민원 목록","url":"/support/complain","icon":"📋"}}]
- "내 문의 조회/1대1 문의 목록" → __BUTTONS__[{{"label":"내 문의 목록","url":"/support/qna","icon":"📋"}}]
- "공지사항 보고싶다/공지 목록" → __BUTTONS__[{{"label":"공지사항","url":"/support/notice","icon":"📢"}}]
- "최근 공지사항/최신 공지/공지 알려줘" → query_database:
  SELECT notice_id, notice_title, notice_ctnt, created_at FROM notice ORDER BY created_at DESC LIMIT 3
  → 제목 + 내용 요약(50자 이내) 출력 후 __BUTTONS__[{{"label":"전체 공지 보기","url":"/support/notice","icon":"📢"}}]

[룸서비스]
- "룸서비스 주문/주문하고 싶어/상품 주문/룸서비스 이용" → 바로 버튼 안내 (DB 조회 금지):
  __BUTTONS__[{{"label":"룸서비스 주문하기","url":"/me?tab=roomservice","icon":"🛒"}}]
- "구매가능 품목/룸서비스 상품/건물 상품" → query_database:
  SELECT pbs.prod_nm, pbs.prod_stock, b.building_nm FROM product_building_stock pbs JOIN building b ON pbs.building_id=b.building_id WHERE b.delete_yn='N' ORDER BY b.building_nm, pbs.prod_nm
  건물명이 언급된 경우 WHERE b.building_nm LIKE '%건물명%' 추가
  → 재고 0인 항목은 "(품절)"로 표시
- "내 결제내역/구매내역/결제 조회" → query_my_data 반드시 호출:
  SQL(변경금지): SELECT p.payment_id, sg.service_goods_nm, p.total_price, p.payment_st, p.paid_at FROM payment p JOIN service_goods sg ON p.service_goods_id=sg.service_goods_id WHERE p.user_id='{{user_id}}' ORDER BY p.paid_at DESC LIMIT 10
  ★ 결과 0건 → 아래 형식 그대로 출력 (다른 말 추가 금지):
    결제 내역이 없습니다.
    __BUTTONS__[{{"label":"룸서비스 바로가기","url":"/me?tab=roomservice","icon":"🛒"}}]
  ★ 결과 1건 이상 → 목록 안내 후 반드시:
    __BUTTONS__[{{"label":"결제 내역 보기","url":"/me?tab=roomservice","icon":"💳"}}]
- "룸서비스 추천/살거 추천/물품 추천" → query_my_data 1회만 실행:
    SQL(변경금지): SELECT p.prod_nm, SUM(oi.order_quantity) as cnt FROM order_items oi JOIN product p ON oi.prod_id=p.prod_id JOIN orders o ON oi.order_id=o.order_id WHERE o.user_id='{{user_id}}' AND o.order_st='paid' GROUP BY p.prod_id, p.prod_nm ORDER BY cnt DESC LIMIT 10
  ★ 결과 있음 → 품목명(prod_nm)과 구매 횟수(cnt) 목록을 출력 후:
    __BUTTONS__[{{"label":"룸서비스 바로가기","url":"/me?tab=roomservice","icon":"🛒"}}]
  ★ 결과 0건 → tool 결과만 반환하고 답변 생성 금지. 시스템이 자동 처리함.

[페이지]
방목록:/rooms 방상세:/rooms/{{roomId}} 건물목록:/buildings 건물상세:/buildings/{{buildingId}}
  ⚠️ 방/건물 상세 버튼엔 실제 ID 사용
투어예약:/reservations/tour/create 투어목록:/reservations/tour/list
공용시설목록:/spaces 공용예약신청:/reservations/space/create 내공용예약:/reservations/space/list
리뷰커뮤니티:/community?tab=REVIEW 내리뷰:/me?tab=posts&sub=community&postTab=reviews
계약신청:/contracts/apply?roomId={{roomId}}
공지:/support/notice FAQ:/support/faq 문의:/support/qna/write 민원:/support/complain/write
룸서비스:/me?tab=roomservice 민원목록:/support/complain 문의목록:/support/qna

[답변 원칙]
- 사용자 언어로 답변
- 금액: 한국어 "50만원" / 기타 "500,000 KRW"
- 페이지 이동 필요 시 답변 끝에 버튼: __BUTTONS__[{{"label":"버튼명","url":"/경로","icon":"이모지"}}]
- ★ 버튼은 반드시 __BUTTONS__[...] 형식으로만 출력. "📝 내가 쓴 글 보기" 같이 텍스트로 버튼명을 쓰는 것은 절대 금지.
- 답변 앞에 [UNI PLACE AI], [AI], [챗봇] 등 어떤 접두어도 절대 붙이지 말 것
- 공용공간/헬스/라운지/회의실/스터디룸 언급이 있으면 query_my_data를 즉시 실행하고 되묻지 말 것

[DB 스키마]
{DB_SCHEMA}"""


def _extract_buttons(answer: str) -> tuple[str, list[dict]]:
    """
    AI 답변에서 버튼 정보를 파싱해 (정제된 답변, 버튼목록) 반환.
    지원 형식:
      1. __BUTTONS__[{"label":...,"url":...}]  ← 정상 형식
      2. <button label="..." url="..." icon="..."></button>  ← 태그 형식
      3. [{"label":...,"url":...}]  ← 순수 JSON 배열 (답변 전체가 버튼인 경우)
    """
    import re, json as _json

    buttons = []
    clean_answer = answer

    # 형식 1: __BUTTONS__[...]
    pattern1 = r'__BUTTONS__\s*(\[.*?\])'
    match = re.search(pattern1, answer, re.DOTALL)
    if match:
        raw_buttons = match.group(1)
        # LLM이 f-string 템플릿의 {{ }} 를 그대로 출력하는 경우 정규화
        raw_buttons = raw_buttons.replace('{{', '{').replace('}}', '}')
        clean_answer = answer[:match.start()].strip()
        try:
            parsed = _json.loads(raw_buttons)
            if isinstance(parsed, list):
                buttons = [b for b in parsed if isinstance(b, dict) and b.get("url")]
        except Exception:
            pass
        return clean_answer, buttons

    # 형식 2: <button label="..." url="..." icon="...">...</button>
    pattern2 = r'<button\s+label=["\']([^"\']*)["\']\s+url=["\']([^"\']*)["\'](?:\s+icon=["\']([^"\']*)["\'])?\s*(?:/?>|>.*?</button>)'
    btn_matches = re.findall(pattern2, answer, re.DOTALL | re.IGNORECASE)
    if btn_matches:
        for label, url, icon in btn_matches:
            buttons.append({"label": label, "url": url, "icon": icon or "🔗"})
        clean_answer = re.sub(pattern2, '', answer, flags=re.DOTALL | re.IGNORECASE).strip()
        return clean_answer, buttons

    # 형식 3: 답변 전체 또는 끝부분이 JSON 배열 [{"label":...,"url":...}]
    stripped = answer.strip()
    # {{ }} → { } 정규화 (LLM이 f-string escape 그대로 출력하는 경우 대응)
    stripped_norm = stripped.replace("{{", "{").replace("}}", "}")
    # 끝에 붙은 JSON 배열 감지
    json_arr_pattern = r'(\[\s*\{\s*"label".*?\]\s*)$'
    arr_match = re.search(json_arr_pattern, stripped_norm, re.DOTALL)
    if arr_match:
        try:
            parsed = _json.loads(arr_match.group(1))
            if isinstance(parsed, list):
                for b in parsed:
                    if isinstance(b, dict) and b.get("url"):
                        buttons.append(b)
                clean_answer = stripped[:arr_match.start()].strip()
        except Exception:
            pass
        if buttons:
            return clean_answer, buttons

    # 형식 4: 마크다운 링크 [label](url) 패턴
    md_link_pattern = r'\[([^\]]+)\](/[^)]+)'
    md_matches = re.findall(md_link_pattern, answer)
    if md_matches:
        for label, url in md_matches:
            buttons.append({"label": label, "url": url, "icon": "🔗"})
        clean_answer = re.sub(r'\[([^\]]+)\](/[^)]+)', '', answer).strip()
        return clean_answer, buttons

    # 형식 5: 이모지+텍스트만 있고 __BUTTONS__ 없는 경우 → 버튼 URL 매핑 시도
    _KNOWN_BUTTON_URLS = {
        "룸서비스": "/me?tab=roomservice",
        "결제 내역": "/me?tab=roomservice",
        "내가 쓴 글": "/me?tab=posts",
        "투어 예약": "/reservations/tour/create",
        "내 예약 조회": "/reservations/tour/list",
        "공지사항": "/support/notice",
        "민원 작성": "/support/complain/write",
        "문의하기": "/support/qna/write",
    }
    return answer.strip(), []


def run_tool_orchestrator(req: AiRequest) -> AiResponse:
    """모든 챗봇 요청의 단일 진입점."""
    prompt = (req.prompt or "").strip()
    if not prompt:
        return AiResponse(answer="무엇을 도와드릴까요?", confidence=1.0)

    # user_id 다중 경로 fallback: req.user_id → slots.userId → slots.slots.userId
    user_id = req.user_id
    if not user_id:
        slots = req.slots or {}
        user_id = (slots.get("userId")
                   or slots.get("user_id")
                   or (slots.get("slots") or {}).get("userId")
                   or (slots.get("slots") or {}).get("user_id"))
    provider = (settings.llm_provider or "groq").lower()
    logger.info("[ToolOrchestrator] request user_id=%s slots_userId=%s",
                user_id, (req.slots or {}).get("userId", "MISSING"))
    try:
        return _run(prompt, req.get_history(), user_id, provider)
    except Exception as e:
        logger.error("[ToolOrchestrator] 처리 실패: %s", e, exc_info=True)
        return AiResponse(
            answer="죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            confidence=0.0,
        )


def _force_space_query(user_id: str, prompt: str) -> "AiResponse":
    """LLM이 tool을 실행하지 않을 때 공용공간 조회를 Python에서 직접 실행."""
    import datetime as _dt
    import re as _re2

    logger.info("[_force_space_query] user_id=%s", user_id)
    _s1 = execute_tool("query_my_data", {
        "sql": f"SELECT b.building_id, b.building_nm FROM contract c JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id WHERE c.user_id='{user_id}' AND c.contract_st='active' LIMIT 1",
        "description": "계약 빌딩 조회"
    }, user_id)
    logger.info("[_force_space_query] s1_result=%s", _s1)
    _s1_data = (_s1 or {}).get("data") or []
    if not _s1_data:
        _s1_err = (_s1 or {}).get('error', '')
        _s1_success = (_s1 or {}).get('success', False)
        logger.warning("[_force_space_query] 계약 없음 or 조회실패 success=%s error=%s", _s1_success, _s1_err)
        if not _s1_success and _s1_err:
            # 조회 실패 → LLM에게 맡기지 말고 에러 안내
            return AiResponse(
                answer="공용공간 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                confidence=0.95,
            )
        return AiResponse(
            answer="현재 활성 계약이 없어 공용공간 예약을 이용하실 수 없습니다.",
            confidence=0.95,
            metadata={"action_buttons": [{"label": "방 둘러보기", "url": "/rooms", "icon": "🏠"}]},
        )
    _building_id = _s1_data[0].get("building_id")
    _building_nm = _s1_data[0].get("building_nm", "")

    _s2 = execute_tool("query_database", {
        "sql": f"SELECT cs.space_id, cs.space_nm, cs.space_capacity, cs.space_floor, cs.space_options FROM common_space cs WHERE cs.building_id={_building_id}",
        "description": "공용공간 목록 조회"
    }, user_id)
    _s2_data = (_s2 or {}).get("data") or []
    logger.info("[ToolOrchestrator] _force_space_query building=%s spaces=%d건", _building_nm, len(_s2_data))
    if not _s2_data:
        return AiResponse(answer=f"{_building_nm} 건물에 등록된 공용공간이 없습니다.", confidence=0.90)

    # 날짜 계산
    _target_date = None
    _dm = _re2.search(r"(\d{4}-\d{2}-\d{2})", prompt)
    if _dm:
        _target_date = _dm.group(1)
    else:
        _wmap = {"월": 0, "화": 1, "수": 2, "목": 3, "금": 4, "토": 5, "일": 6}
        for _wd, _wn in _wmap.items():
            if _wd + "요일" in prompt or _wd + "날" in prompt:
                _today = _dt.date.today()
                _diff = (_wn - _today.weekday()) % 7 or 7
                _target_date = (_today + _dt.timedelta(days=_diff)).strftime("%Y-%m-%d")
                break

    _OPT_MAP = {
        "fitness": "피트니스", "gym": "헬스장", "lounge": "라운지",
        "meeting": "회의실", "study": "스터디룸", "coworking": "코워킹",
        "library": "도서관", "rooftop": "루프탑", "cafe": "카페",
    }
    _lines = [f"{_building_nm} 건물의 공용공간 현황입니다.\n"]
    for _sp in _s2_data:
        _sid  = _sp.get("space_id")
        _snm  = _sp.get("space_nm", "")
        _flr  = _sp.get("space_floor", "")
        _cap  = _sp.get("space_capacity", "")
        _raw_opt = _sp.get("space_options", "")
        _opt  = _OPT_MAP.get(str(_raw_opt).lower(), _raw_opt)
        _line = f"**{_snm}** ({_flr}층, 수용인원 {_cap}명, {_opt})"
        if _target_date:
            _s3 = execute_tool("query_database", {
                "sql": f"SELECT sr.sr_start_at, sr.sr_end_at FROM space_reservations sr WHERE sr.space_id={_sid} AND DATE(sr.sr_start_at)='{_target_date}' AND sr.sr_st NOT IN('cancelled','ended')",
                "description": f"{_snm} {_target_date} 예약현황"
            }, user_id)
            _s3_data = (_s3 or {}).get("data") or []
            if _s3_data:
                _slots = ", ".join([
                    f"{str(r.get('sr_start_at',''))[11:16]}~{str(r.get('sr_end_at',''))[11:16]}"
                    for r in _s3_data
                ])
                _line += f": {_target_date} {_slots} 예약됨"
            else:
                _line += f": {_target_date} 전일 이용 가능"
        _lines.append(f"- {_line}")

    return AiResponse(
        answer="\n".join(_lines),
        confidence=0.95,
        metadata={"action_buttons": [
            {"label": "🛋️ 바로 예약하기", "url": "/reservations/space/create", "icon": "📅"},
            {"label": "📋 내 예약 조회",  "url": "/reservations/space/list",   "icon": "📋"},
        ]},
    )


def _force_popular_goods_query(user_id: str) -> "AiResponse":
    """
    룸서비스 추천: Python이 직접 실행.
    Step1 - 내 구매 이력(집계)
    Step2 - admin SQL로 전체 인기 품목 (user_id 조건 없이)
    """
    logger.info("[_force_popular_goods_query] user_id=%s", user_id)

    # Step1: 내 구매 이력 집계
    my_result = execute_tool("query_my_data", {
        "sql": f"SELECT p.prod_nm, SUM(oi.order_quantity) as cnt FROM order_items oi JOIN product p ON oi.prod_id=p.prod_id JOIN orders o ON oi.order_id=o.order_id WHERE o.user_id='{user_id}' AND o.order_st='paid' GROUP BY p.prod_id, p.prod_nm ORDER BY cnt DESC LIMIT 10",
        "description": "내 구매 이력 집계"
    }, user_id)
    my_data = (my_result or {}).get("data") or []

    # Step2: 전체 인기 품목 (query_database_admin — user_id 조건 없이 전체 집계)
    # userId를 넘겨서 로그인된 사용자 요청임을 보장 (외부 비로그인 호출 차단)
    pop_result = execute_tool("query_database_admin", {
        "sql": "SELECT p.prod_nm, SUM(oi.order_quantity) as total_qty FROM order_items oi JOIN product p ON oi.prod_id=p.prod_id JOIN orders o ON oi.order_id=o.order_id WHERE o.order_st='paid' GROUP BY p.prod_id, p.prod_nm ORDER BY total_qty DESC LIMIT 10",
        "description": "전체 인기 룸서비스 품목 집계"
    }, user_id)
    pop_data = (pop_result or {}).get("data") or []

    logger.info("[_force_popular_goods_query] my_data=%d popular=%d", len(my_data), len(pop_data))

    if not my_data and not pop_data:
        return AiResponse(
            answer="아직 판매 데이터가 없습니다. 품목 목록은 아래에서 확인하세요.",
            confidence=0.95,
            metadata={"action_buttons": [{"label": "🛒 룸서비스 바로가기", "url": "/me?tab=roomservice", "icon": "🛒"}]},
        )

    lines = []
    if my_data:
        lines.append("**자주 구매하신 품목을 기반으로 추천드립니다.**")
        for item in my_data[:5]:
            nm = item.get("prod_nm", "") or item.get("service_goods_nm", "")
            cnt = item.get("cnt", "")
            lines.append(f"- {nm} (구매 {cnt}회)")
        if pop_data:
            lines.append("\n**전체 인기 품목도 함께 참고하세요.**")
            for item in pop_data[:3]:
                nm = item.get("service_goods_nm", "")
                tc = item.get("total_cnt", "")
                lines.append(f"- {nm} (전체 {tc}건)")
    else:
        lines.append("**전체 인기 품목을 추천드립니다.**")
        for item in pop_data[:5]:
            nm = item.get("prod_nm", "") or item.get("service_goods_nm", "")
            tc = item.get("total_qty", "") or item.get("total_cnt", "")
            lines.append(f"- {nm} (전체 {tc}건)")

    answer = "\n".join(lines)
    return AiResponse(
        answer=answer,
        confidence=0.95,
        metadata={"action_buttons": [{"label": "🛒 룸서비스 바로가기", "url": "/me?tab=roomservice", "icon": "🛒"}]},
    )


def _run(prompt: str, history: list[dict], user_id: str | None, provider: str) -> AiResponse:
    client = _get_client(provider)
    if client is None:
        return AiResponse(answer="AI 서비스 설정이 필요합니다.", confidence=0.0)

    primary_model = {
        "groq":   settings.groq_model,
        "openai": settings.openai_model,
        "gemini": settings.gemini_model,
    }.get(provider, settings.groq_model)
    _today_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        today=__import__("datetime").date.today().strftime("%Y-%m-%d"),
        DB_SCHEMA=DB_SCHEMA
    )
    messages      = _build_messages(prompt, history, user_id, _today_prompt)
    tools         = _to_openai_tools(TOOL_DEFINITIONS)

    # ── Step 1: tool 선택 (429 시 fallback 자동 전환) ──────────────────────────
    # DB 조회가 필요한 키워드면 tool 실행 강제 (hallucination 방지)
    _db_required_keywords = [
        "공용공간", "공용 공간", "헬스", "라운지", "회의실", "스터디", "피트니스",
        "예약", "계약", "납부", "월세", "관리비", "민원", "공지", "FAQ",
        "건물", "방", "룸", "리뷰", "투어",
    ]
    _needs_tool = any(kw in prompt for kw in _db_required_keywords)
    _tool_choice = "required" if _needs_tool else "auto"
    logger.info("[ToolOrchestrator] tool_choice=%s (needs_tool=%s)", _tool_choice, _needs_tool)

    resp1, used_model = _call_with_fallback(
        client, provider, primary_model,
        dict(temperature=0.0, max_tokens=1024, messages=messages,
             tools=tools, tool_choice=_tool_choice),
    )
    if resp1 is None:
        return AiResponse(answer="AI 서비스에 일시적인 문제가 있습니다.", confidence=0.0)

    choice = resp1.choices[0]
    raw_content = (choice.message.content or "").strip()

    # ★ 일부 모델이 tool_calls 대신 텍스트에 <function=...> 또는 <function>...</function> 를 섞어 반환하는 경우 감지
    if "<function=" in raw_content or "<function_calls>" in raw_content or "<function>" in raw_content:
        logger.warning("[ToolOrchestrator] 모델 %s 가 tool call을 텍스트로 반환 — "
                       "tool calling 미지원 모델. 답변 재생성 시도.", used_model)
        # tool call 텍스트 제거 후 일반 답변으로 재요청
        clean_messages = _build_messages(prompt, history, user_id, _today_prompt)
        clean_messages[-1]["content"] += "\n(도구를 사용하지 말고 알고 있는 내용으로 간단히 답변하세요)"
        resp_clean, _ = _call_with_fallback(
            client, provider, used_model,
            dict(temperature=0.3, max_tokens=2048, messages=clean_messages),
        )
        answer = (resp_clean.choices[0].message.content or "").strip() if resp_clean else \
                 "죄송합니다, 잠시 후 다시 시도해주세요."
        answer = _clean_function_call_text(answer)
        return AiResponse(answer=answer, confidence=0.60)

    # LLM이 tool 없이 직접 답변 (finish_reason="stop")
    if choice.finish_reason == "stop":
        _roomservice_keywords = ["룸서비스 추천", "살거 추천", "물품 추천", "룸서비스 살", "뭐 살", "살거", "뭐가 좋", "뭐 좋", "품목 추천"]
        if user_id and any(kw in prompt for kw in _roomservice_keywords):
            logger.warning("[ToolOrchestrator] stop + 룸서비스 추천 → _force_popular_goods_query")
            return _force_popular_goods_query(user_id)
        _space_keywords = ["공용공간", "공용 공간", "헬스", "라운지", "회의실", "스터디", "피트니스", "근무 공간", "공간 예약"]
        if user_id and any(kw in prompt for kw in _space_keywords):
            logger.warning("[ToolOrchestrator] stop + 공용공간 키워드 → _force_space_query")
            return _force_space_query(user_id, prompt)
        logger.info("[ToolOrchestrator] 직접 답변 model=%s", used_model)
        clean_answer, buttons = _extract_buttons(raw_content)
        if not clean_answer and buttons:
            clean_answer = "아래 버튼을 이용해 주세요."
        elif not clean_answer:
            clean_answer = raw_content
        direct_meta = {"action_buttons": buttons} if buttons else {}
        return AiResponse(answer=clean_answer, confidence=0.90, metadata=direct_meta)

    tool_calls = choice.message.tool_calls or []
    logger.info("[ToolOrchestrator] finish_reason=%s tool_calls_count=%d",
                choice.finish_reason, len(tool_calls))

    if not tool_calls:
        _roomservice_keywords = ["룸서비스 추천", "살거 추천", "물품 추천", "룸서비스 살", "뭐 살", "살거", "뭐가 좋", "뭐 좋", "품목 추천"]
        if user_id and any(kw in prompt for kw in _roomservice_keywords):
            logger.warning("[ToolOrchestrator] tool_calls 없음 + 룸서비스 추천 → _force_popular_goods_query")
            return _force_popular_goods_query(user_id)
        _space_keywords = ["공용공간", "공용 공간", "헬스", "라운지", "회의실", "스터디", "피트니스", "근무 공간", "공간 예약"]
        if user_id and any(kw in prompt for kw in _space_keywords):
            logger.warning("[ToolOrchestrator] tool_calls 비어있음 + 공용공간 키워드 → 강제 DB 조회")
            return _force_space_query(user_id, prompt)
        return AiResponse(answer=raw_content, confidence=0.80)

    # ── Step 2: tool 실행 ──────────────────────────────────────────────────────
    all_context: list[str] = []
    tool_result_msgs       = []
    _actual_space_list     = []  # Step2 common_space 실제 조회 결과 저장

    for tc in tool_calls:
        tool_name = tc.function.name
        try:
            tool_args = json.loads(tc.function.arguments or "{}")
        except json.JSONDecodeError:
            tool_args = {}

        logger.info("[ToolOrchestrator] Step2 tool=%s desc=%s",
                    tool_name, tool_args.get("description", tool_args.get("sql", ""))[:100])

        # ── RAG 검색 — Python 내부 처리 (Spring 호출 없음) ───────────────────
        if tool_name == "rag_search":
            rag_result = execute_rag_search(tool_args.get("query", ""))
            result = {"success": True, "data": rag_result.get("results", []), "rag": True}
            if not rag_result.get("found"):
                result["message"] = "관련 문서를 찾지 못했습니다."

        elif tool_name in AUTH_REQUIRED_TOOLS and not user_id:
            # 비로그인 → 즉시 명시적 응답 반환 (LLM에 넘기지 않음)
            logger.warning("[ToolOrchestrator] %s 호출됐으나 user_id=None → 로그인 안내", tool_name)
            return AiResponse(
                answer="로그인 후 이용 가능한 기능입니다. 로그인하시면 계약 정보, 공용공간 예약 등 개인화된 서비스를 이용하실 수 있습니다.",
                confidence=0.95,
                metadata={"action_buttons": [{"label": "로그인하기", "url": "/login", "icon": "🔐"}]},
            )
        else:
            if tool_name == "query_my_data" and user_id:
                sql = tool_args.get("sql", "")
                tool_args["sql"] = sql.replace("{user_id}", user_id)
            # room_options 옵션 키워드 양방향 정규화 (한글↔영문 모두 검색)
            if "sql" in tool_args:
                tool_args["sql"] = _normalize_options_in_sql(tool_args["sql"])
            result = execute_tool(tool_name, tool_args, user_id)

        # ★ Step2 결과 상세 로그 — 실패 원인 파악용
        if not result.get("success"):
            logger.error("[ToolOrchestrator] Step2 FAILED tool=%s error=%s",
                         tool_name, result.get("error"))
            # AUTH_REQUIRED: 로그인은 됐으나 권한 없음 (서버측 거부)
            if result.get("error") == "AUTH_REQUIRED":
                return AiResponse(
                    answer="해당 정보를 조회할 권한이 없습니다. 로그인 상태를 확인해 주세요.",
                    confidence=0.95,
                    metadata={"action_buttons": [{"label": "로그인하기", "url": "/login", "icon": "🔐"}]},
                )
            # DB 오류 시 LLM이 재시도 JSON을 출력하지 않도록 명시적 실패 메시지 주입
            result = {
                "success": False,
                "data": [],
                "error": "데이터베이스 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                "_db_error": True,
            }
        else:
            logger.info("[ToolOrchestrator] Step2 OK tool=%s rows=%d",
                        tool_name, len(result.get("data") or []))
            # query_my_data 결과 로그
            if tool_name == "query_my_data":
                logger.info("[ToolOrchestrator] query_my_data rows=%d user_id=%s",
                            len(result.get("data") or []), user_id)
                # 룸서비스 추천 요청인데 내 구매 이력이 0건 → 전체 인기 품목 직접 조회 후 주입
                _rs_keywords = ["룸서비스 추천", "살거 추천", "물품 추천", "룸서비스 살", "뭐 살", "추천해줘"]
                _rs_sql = str(tool_args.get("sql", "")).lower()
                _is_rs_sql = ("order_items" in _rs_sql or "product" in _rs_sql or "payment" in _rs_sql or "service_goods" in _rs_sql)
                logger.info("[ToolOrchestrator] rs_check: is_rs_sql=%s rows=%d sql_preview=%s",
                            _is_rs_sql, len(result.get("data") or []), _rs_sql[:80])
                if (not (result.get("data") or [])
                        and _is_rs_sql
                        and any(kw in prompt for kw in _rs_keywords)):
                    # 0건이면 즉시 인기품목 조회로 전환 (LLM이 답변 생성하기 전에 처리)
                    logger.info("[ToolOrchestrator] 구매이력 0건 → _force_popular_goods_query 즉시 반환")
                    return _force_popular_goods_query(user_id)
                    logger.info("[ToolOrchestrator] 내 구매이력 0건 + 룸서비스추천 → 전체 인기품목 주입")
                    _pop = execute_tool("query_database_admin", {
                        "sql": "SELECT sg.service_goods_nm, COUNT(*) as total_cnt FROM payment p JOIN service_goods sg ON p.service_goods_id=sg.service_goods_id WHERE p.payment_st='paid' GROUP BY sg.service_goods_nm ORDER BY total_cnt DESC LIMIT 10",
                        "description": "전체 인기 품목 집계"
                    }, user_id)
                    _pop_data = (_pop or {}).get("data") or []
                    logger.info("[ToolOrchestrator] 전체 인기품목 rows=%d", len(_pop_data))
                    if _pop_data:
                        # LLM에 맡기지 않고 Python이 직접 답변 생성해서 즉시 반환
                        _rec_lines = ["구매 이력이 없어 전체 인기 품목을 추천해드립니다.\n"]
                        for i, _p in enumerate(_pop_data[:5], 1):
                            _nm = _p.get("service_goods_nm", "")
                            _cnt = _p.get("total_cnt", "")
                            _rec_lines.append(f"{i}. {_nm} (전체 {_cnt}건 판매)")
                        _rec_answer = "\n".join(_rec_lines)
                        logger.info("[ToolOrchestrator] 룸서비스 추천 Python 직접 생성 반환")
                        return AiResponse(
                            answer=_rec_answer,
                            confidence=0.95,
                            metadata={"action_buttons": [{"label": "🛒 룸서비스 바로가기", "url": "/me?tab=roomservice", "icon": "🛒"}]},
                        )
                    else:
                        return AiResponse(
                            answer="아직 판매 데이터가 없습니다. 품목 목록은 아래에서 확인하세요.",
                            confidence=0.95,
                            metadata={"action_buttons": [{"label": "🛒 룸서비스 바로가기", "url": "/me?tab=roomservice", "icon": "🛒"}]},
                        )

        context_docs = format_tool_result(tool_name, result)

        # ★ common_space 조회 결과 저장 (hallucination 방지용)
        _sql_str = str(tool_args.get("sql", ""))
        if (tool_name == "query_database"
                and "common_space" in _sql_str
                and "space_reservations" not in _sql_str
                and result.get("success")
                and result.get("data")):
            _actual_space_list = result["data"]
            logger.info("[ToolOrchestrator] common_space 실제 조회 결과 저장: %d건", len(_actual_space_list))

        # ★ space_reservations 조회 결과가 비어있으면 "예약 없음" 명시 주입
        # → LLM이 임의 시간대를 hallucination하는 것 방지
        if (tool_name == "query_database"
                and result.get("success")
                and not (result.get("data") or [])
                and "space_reservations" in str(tool_args.get("sql", ""))):
            explicit_msg = "tool 조회 결과: rows=0. 이 날짜에 예약된 시간대가 전혀 없습니다. 반드시 '전일 이용 가능'으로만 답할 것. 어떤 시간대도 임의로 생성하지 말 것."
            context_docs = [explicit_msg]
            logger.info("[ToolOrchestrator] space_reservations rows=0 → 전일이용가능 명시 주입")

        all_context.extend(context_docs)
        tool_result_msgs.append({
            "tool_call_id": tc.id,
            "role":         "tool",
            "content":      "\n".join(context_docs),
        })

    # ── space_reservations 결과 검증: hallucination 방지 ─────────────────────────
    # tool 실행 중 space_reservations 조회가 있었다면 결과를 직접 context에 명시
    _sr_results = []
    for tc in tool_calls:
        try:
            _args = json.loads(tc.function.arguments or "{}")
        except Exception:
            _args = {}
        if tc.function.name == "query_database" and "space_reservations" in str(_args.get("sql", "")):
            _sr_results.append(_args)

    # ★ Step3 직전 강제 지시 주입 (공간목록 + 예약현황 hallucination 방지)
    # tool 결과에서 실제 조회된 공간 목록 추출
    _actual_spaces = []
    _has_sr_query = False
    for tc in tool_calls:
        try:
            _args = json.loads(tc.function.arguments or "{}")
        except Exception:
            _args = {}
        _sql = str(_args.get("sql", ""))
        if tc.function.name == "query_database" and "common_space" in _sql and "space_reservations" not in _sql:
            # Step2 결과에서 실제 공간 추출
            for _msg in tool_result_msgs:
                if _msg.get("tool_call_id") == tc.id:
                    _actual_spaces.append(_msg.get("content", ""))
        if tc.function.name == "query_database" and "space_reservations" in _sql:
            _has_sr_query = True

    anti_hallucination_parts = []
    if _actual_spaces:
        anti_hallucination_parts.append(
            "⚠️ 공간 목록은 반드시 위 tool 결과에 있는 공간만 사용하세요. "
            "tool 결과에 없는 공간(라운지, 스터디룸 등)을 임의로 추가하는 것은 엄격히 금지입니다."
        )
    if _has_sr_query:
        anti_hallucination_parts.append(
            "⚠️ 예약 현황: rows=0인 공간은 반드시 '전일 이용 가능'으로만 표시하세요. "
            "임의의 시간대를 만들지 마세요. rows>0이면 실제 sr_start_at~sr_end_at만 표시하세요."
        )

    # 실제 공간 목록을 명시적으로 주입
    if _actual_space_list:
        space_names = [str(row.get("space_nm", row)) for row in _actual_space_list]
        anti_hallucination_parts.insert(0,
            f"⚠️ [실제 DB 공간 목록] 이 건물에는 다음 공간만 존재합니다: {', '.join(space_names)}. "
            f"이 목록에 없는 공간(라운지, 스터디룸, 회의실 등)은 절대로 답변에 포함하지 마세요. "
            f"총 {len(space_names)}개 공간만 안내하세요."
        )

    # ★ 핵심: common_space 조회가 없고 공용공간 키워드면 → Python이 직접 강제 실행
    _space_keywords = ["공용공간", "공용 공간", "헬스", "라운지", "회의실", "스터디", "피트니스", "근무 공간", "공간 예약"]
    _had_space_query = any(
        tc.function.name == "query_database" and "common_space" in str(json.loads(tc.function.arguments or "{}").get("sql",""))
        for tc in tool_calls
    )
    _had_building_result = any("building_id" in c for c in all_context)

    if (not _had_space_query and _had_building_result
            and user_id and any(kw in prompt for kw in _space_keywords)):
        logger.warning("[ToolOrchestrator] common_space 조회 누락 → _force_space_query 강제 실행")
        return _force_space_query(user_id, prompt)

    if anti_hallucination_parts:
        logger.info("[ToolOrchestrator] hallucination 방지 context 주입: spaces=%s",
                    [r.get("space_nm") for r in _actual_space_list])
        tool_result_msgs.append({
            "role": "user",
            "content": " ".join(anti_hallucination_parts),
        })

    # ── Step 3: 최종 답변 생성 (같은 모델 사용, 429 시 다시 fallback) ─────────
    logger.info("[ToolOrchestrator] Step3 context_lines=%d model=%s", len(all_context), used_model)

    # 룸서비스 추천이고 인기 품목 데이터가 주입됐으면 추가 지시 메시지 삽입
    _rs_kws2 = ["룸서비스 추천", "살거 추천", "물품 추천", "룸서비스 살", "뭐 살", "추천해줘"]
    _has_popular = any("[전체 인기 품목 데이터" in c for c in all_context)
    if any(kw in prompt for kw in _rs_kws2) and all_context:
        tool_result_msgs.append({
            "role": "user",
            "content": (
                "위 조회 결과를 바탕으로 추천 품목을 반드시 목록(- 품목명) 형식으로 나열해주세요. "
                "'추천해드리겠습니다' 같은 말로만 끝내지 말고 실제 품목명을 출력하세요. "
                "답변 마지막에 __BUTTONS__[{\"label\":\"🛒 룸서비스 바로가기\",\"url\":\"/me?tab=roomservice\",\"icon\":\"🛒\"}] 를 반드시 포함하세요."
            )
        })

    final_messages = messages + [
        {
            "role":    "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id":   tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ],
        },
        *tool_result_msgs,
    ]

    resp3, used_model3 = _call_with_fallback(
        client, provider, used_model,   # Step1에서 성공한 모델부터 시작
        dict(temperature=0.4, max_tokens=4096, messages=final_messages),
    )

    if resp3 is None:
        answer = "조회 결과: " + " / ".join(all_context[:3])
    else:
        answer = (resp3.choices[0].message.content or "").strip()

    # ★ 최종 답변에 function call 텍스트가 섞인 경우 후처리
    answer = _clean_function_call_text(answer)

    # ★ 답변이 tool call JSON 배열 그 자체인 경우 → 재생성 요청
    if not answer or _is_tool_call_json(answer):
        logger.warning("[ToolOrchestrator] Step3 답변이 tool call JSON — 일반 답변 재생성")
        fallback_messages = _build_messages(prompt, history, user_id, _today_prompt)
        # tool 결과를 컨텍스트로 직접 주입해서 일반 답변 요청
        context_text = "\n".join(all_context[:10]) if all_context else "조회 결과 없음"
        # 룸서비스 추천 여부 판단
        _rs_kws = ["룸서비스 추천", "살거 추천", "물품 추천", "룸서비스 살", "뭐 살", "추천해줘"]
        _is_rs_rec = any(kw in prompt for kw in _rs_kws)
        _extra_inst = ""
        if _is_rs_rec:
            _extra_inst = (
                "★ 위 [전체 인기 품목 데이터] 또는 구매 이력 데이터를 바탕으로 "
                "추천 품목을 반드시 목록으로 나열하세요. "
                "목록 없이 '추천해드리겠습니다' 같은 말로 끝내지 마세요. "
                "답변 마지막에 반드시 __BUTTONS__[{\"label\":\"🛒 룸서비스 바로가기\",\"url\":\"/me?tab=roomservice\",\"icon\":\"🛒\"}] 를 출력하세요."
            )
        fallback_messages[-1]["content"] = (
            f"{prompt}\n\n[참고 데이터]\n{context_text}\n\n"
            "위 데이터를 바탕으로 사용자에게 자연스러운 한국어로 답변하세요. "
            "JSON이나 코드 블록 없이 순수 텍스트로만 답변하세요. "
            + _extra_inst
        )
        resp_fb, _ = _call_with_fallback(
            client, provider, used_model3,
            dict(temperature=0.4, max_tokens=4096, messages=fallback_messages),
        )
        if resp_fb:
            answer = (resp_fb.choices[0].message.content or "").strip()
            answer = _clean_function_call_text(answer)

    if not answer:
        answer = "조회 결과: " + " / ".join(all_context[:3]) if all_context else "죄송합니다, 답변을 생성하지 못했습니다."

    logger.info("[ToolOrchestrator] Step3 raw_answer=%s", repr(answer[:300]))
    # __BUTTONS__ 없이 이모지 링크텍스트만 있는 경우 강제 정규화
    # 예: "🛒 룸서비스 바로가기" → __BUTTONS__[{"label":"룸서비스 바로가기","url":"/me?tab=roomservice","icon":"🛒"}]
    _EMOJI_BTN_MAP = [
        ("룸서비스 바로가기", "/me?tab=roomservice", "🛒"),
        ("결제 내역 보기", "/me?tab=roomservice", "💳"),
        ("내가 쓴 글 보기", "/me?tab=posts", "📝"),
        ("바로 예약하기", "/reservations/tour/create", "📅"),
        ("내 예약 조회", "/reservations/tour/list", "📋"),
        ("공지사항", "/support/notice", "📢"),
        ("민원 작성하기", "/support/complain/write", "📣"),
        ("1대1 문의하기", "/support/qna/write", "💬"),
        ("내 민원 목록", "/support/complain", "📋"),
        ("내 민원 보기", "/support/complain", "📋"),
        ("내 문의 목록", "/support/qna", "📋"),
        ("월세 납부하기", "/me?tab=myroom&sub=rent-payment", "💳"),
    ]
    if "__BUTTONS__" not in answer:
        _injected = []
        _clean = answer
        for _label, _url, _icon in _EMOJI_BTN_MAP:
            if _label in _clean:
                _injected.append(f'{{{{"label":"{_label}","url":"{_url}","icon":"{_icon}"}}}}')
                # 앞뒤 이모지/공백 포함해서 제거
                _clean = _re.sub(
                    rf'[\U0001F000-\U0001FFFF\U00002600-\U000027BF]?\\s*{_re.escape(_label)}',
                    '', _clean
                )
        if _injected:
            answer = _clean.strip() + "\n__BUTTONS__[" + ",".join(_injected) + "]"
            logger.info("[ToolOrchestrator] 이모지 버튼 강제 정규화: %s", _injected)
    clean_answer, buttons = _extract_buttons(answer)
    # 버튼만 있고 텍스트 없는 경우 기본 안내 문구 생성
    if not clean_answer and buttons:
        clean_answer = "아래 버튼을 이용해 주세요."
    elif not clean_answer:
        clean_answer = "죄송합니다, 답변을 생성하지 못했습니다."
    resp_metadata = {"tools": [tc.function.name for tc in tool_calls], "model": used_model3}
    if buttons:
        resp_metadata["action_buttons"] = buttons

    # ── 투어 예약 신청 의도 감지 → recommend_type: tour_reserve 주입 ──────────
    # "방문신청해줘", "예약해줘", "신청해줘" 등에서 building_id를 대화 컨텍스트에서 추출해
    # 프론트에서 TourReservationCreate 모달을 자동으로 열 수 있도록 메타데이터 주입.
    _tour_apply_keywords = ["방문신청", "신청해줘", "예약해줘", "예약신청", "신청할게", "예약할게", "바로 예약"]
    if any(kw in prompt for kw in _tour_apply_keywords):
        # 대화 이력에서 building_id 추출 (query_database 결과 컨텍스트에서 찾기)
        _tour_building_id = None
        for _ctx in all_context:
            import re as _re_tour
            _bid_match = _re_tour.search(r"building_id[=:\s]+([0-9]+)", str(_ctx))
            if _bid_match:
                _tour_building_id = int(_bid_match.group(1))
                break
        # building_id를 못 찾으면 DB에서 건물명으로 조회 시도
        if not _tour_building_id:
            for _ctx in all_context:
                _bnm_match = _re_tour.search(r"Uniplace [A-Z]", str(_ctx))
                if _bnm_match:
                    _bnm = _bnm_match.group(0)
                    _bq = execute_tool("query_database", {
                        "sql": f"SELECT building_id FROM building WHERE building_nm LIKE '%{_bnm}%' AND delete_yn='N' LIMIT 1",
                        "description": "투어 건물 ID 조회"
                    }, None)
                    _bq_data = (_bq or {}).get("data") or []
                    if _bq_data:
                        _tour_building_id = _bq_data[0].get("building_id")
                    break
        # room_id도 컨텍스트에서 추출
        _tour_room_id = None
        import re as _re_tour2
        for _ctx in all_context:
            _rid_match = _re_tour2.search(r"room_id[=:\s]+([0-9]+)", str(_ctx))
            if _rid_match:
                _tour_room_id = int(_rid_match.group(1))
                break
        if _tour_building_id:
            resp_metadata["recommend_type"] = "tour_reserve"
            resp_metadata["building_id"] = _tour_building_id
            if _tour_room_id:
                resp_metadata["room_id"] = _tour_room_id
            logger.info("[ToolOrchestrator] tour_reserve 메타데이터 주입 building_id=%s room_id=%s",
                        _tour_building_id, _tour_room_id)
        # 버튼이 없으면 기본 투어 예약 버튼 추가
        if not buttons:
            resp_metadata["action_buttons"] = [
                {"label": "📅 바로 예약하기", "url": "/reservations/tour/create", "icon": "📅"},
                {"label": "📋 내 예약 조회", "url": "/reservations/tour/list", "icon": "📋"},
            ]

    return AiResponse(
        answer=clean_answer,
        confidence=0.93,
        metadata=resp_metadata,
    )


# ── Rate Limit Fallback ────────────────────────────────────────────────────────

def _call_with_fallback(client, provider: str, start_model: str, kwargs: dict):
    """
    LLM 호출. 429(Rate Limit) 발생 시 fallback 모델로 순서대로 재시도.
    Returns: (completion_response | None, used_model_name)
    """
    # 시도할 모델 목록: 시작 모델 + (groq/gemini면 fallback 목록)
    if provider == "groq":
        candidates = _build_groq_candidates(start_model)
    elif provider == "gemini":
        candidates = _build_gemini_candidates(start_model)
    else:
        candidates = [start_model]

    last_error = None
    for model in candidates:
        try:
            logger.info("[ToolOrchestrator] LLM 호출 model=%s", model)
            resp = client.chat.completions.create(model=model, **kwargs)
            if model != start_model:
                logger.warning("[ToolOrchestrator] fallback 성공: %s → %s", start_model, model)
            return resp, model

        except RateLimitError as e:
            logger.warning("[ToolOrchestrator] 429 model=%s → 다음 모델 시도", model)
            last_error = e
            continue

        except Exception as e:
            err_str = str(e)
            # 모델 지원 종료(400) 또는 rate limit 계열이면 다음 모델 시도
            if "decommissioned" in err_str or "model_not_found" in err_str or "400" in err_str:
                logger.warning("[ToolOrchestrator] 모델 사용 불가 model=%s → 다음 모델 시도", model)
                last_error = e
                continue
            logger.warning("[ToolOrchestrator] 오류 model=%s: %s", model, e)
            last_error = e
            break

    logger.error("[ToolOrchestrator] 모든 모델 실패: %s", last_error)
    return None, start_model


def _build_groq_candidates(primary: str) -> list[str]:
    """primary 모델 + GROQ_FALLBACK_MODELS 중 중복 제거한 순서 목록."""
    seen = set()
    result = []
    for m in [primary] + GROQ_FALLBACK_MODELS:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


GEMINI_FALLBACK_MODELS = [
    "gemini-2.0-flash-lite",  # 경량 — RPM 높음
    "gemini-2.5-flash-lite",  # 실험적 fallback
    "gemini-2.5-flash",       # 실험적 fallback
]


def _build_gemini_candidates(primary: str) -> list[str]:
    seen = set()
    result = []
    for m in [primary] + GEMINI_FALLBACK_MODELS:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


# ── 헬퍼 ──────────────────────────────────────────────────────────────────────

def _get_client(provider: str):
    if provider == "gemini":
        if not settings.gemini_api_key:
            return None
        return OpenAI(api_key=settings.gemini_api_key,
                      base_url=settings.gemini_base_url, timeout=30.0)
    if provider == "groq":
        if not settings.groq_api_key:
            return None
        return OpenAI(api_key=settings.groq_api_key,
                      base_url=settings.groq_base_url, timeout=25.0)
    if provider == "openai":
        if not settings.openai_api_key:
            return None
        return OpenAI(api_key=settings.openai_api_key, timeout=30.0)
    return None


# 직전 사용자 메시지에서 진행 중인 의도를 감지하는 키워드 맵
_ONGOING_INTENT_KEYWORDS = {
    "tour": ["투어 예약", "투어하고 싶", "투어 보고 싶", "방 투어", "tour reservation", "투어 신청"],
    "complain": ["민원 접수", "민원 신청", "불편 신고"],
    "space_reservation": ["공용 공간 예약", "공용시설 예약", "헬스장 예약", "회의실 예약"],
}

_ONGOING_INTENT_HINT = {
    "tour": (
        "⚠️ 사용자는 현재 [투어 예약] 진행 중입니다. "
        "현재 메시지는 투어할 방 정보(빌딩명/호수)를 알려주는 것입니다. "
        "반드시 get_tour_available_slots 도구를 호출해 예약 가능한 시간대를 안내하세요. "
        "query_database로 방 정보를 조회하지 마세요."
    ),
    "complain": (
        "⚠️ 사용자는 현재 [민원 접수] 진행 중입니다. "
        "현재 메시지는 민원 내용입니다. classify_complain_priority 도구를 호출하세요."
    ),
    "space_reservation": (
        "⚠️ 사용자는 현재 [공용 공간 예약] 진행 중입니다. "
        "현재 메시지는 예약할 공간/시간 정보입니다. query_database로 공간 정보를 조회하세요."
    ),
}


def _detect_ongoing_intent(history: list[dict]) -> str | None:
    """직전 2턴 내 사용자 발화에서 진행 중인 의도 감지."""
    recent_user_msgs = [
        m.get("content", "") for m in (history or [])[-4:]
        if m.get("role") == "user"
    ]
    for intent_key, keywords in _ONGOING_INTENT_KEYWORDS.items():
        for msg in recent_user_msgs:
            if any(kw in msg for kw in keywords):
                return intent_key
    return None



# ── 옵션 키워드 양방향 정규화 ──────────────────────────────────────────────────
# DB에 한글로 저장되어 있으면 한글 패턴 → 영문 패턴도 같이 OR 검색
# DB에 영문으로 저장되어 있으면 영문 패턴 → 한글 패턴도 같이 OR 검색
# → 어느 쪽으로 저장되어 있어도 한글/영문 모두 검색되도록 SQL을 확장

_OPTION_ALIASES: list[tuple[list[str], str, str]] = [
    # (검색 키워드 목록,  한글 DB값,  영문 DB값)
    (["에어컨", "aircon", "air conditioner", "에어콘"],    "에어컨",      "aircon"),
    (["냉장고", "refrigerator", "fridge"],                 "냉장고",      "refrigerator"),
    (["세탁기", "washer", "washing machine"],              "세탁기",      "washer"),
    (["침대", "bed"],                                      "침대",        "bed"),
    (["책상", "desk"],                                     "책상",        "desk"),
    (["옷장", "wardrobe", "closet"],                       "옷장",        "wardrobe"),
    (["전자레인지", "microwave"],                           "전자레인지",   "microwave"),
    (["TV", "텔레비전", "television"],                     "TV",          "TV"),
    (["인덕션", "induction"],                              "인덕션",      "induction"),
    (["전기레인지", "electric range", "electric_range"],    "전기레인지",  "electric_range"),
    (["샤워기", "shower"],                                 "샤워기",      "shower"),
    (["욕조", "bathtub"],                                  "욕조",        "bathtub"),
]

def _normalize_options_in_sql(sql: str) -> str:
    """
    SQL 안의 room_options LIKE '%키워드%' 를
    room_options LIKE '%한글%' OR room_options LIKE '%영문%' 형태로 확장.
    이미 OR로 확장된 경우는 건드리지 않음.
    """
    import re as _re2
    if not sql or "room_options" not in sql.lower():
        return sql

    # LIKE '%키워드%' 패턴 치환 (작은따옴표 한정 - SQL 표준)
    pattern = _re2.compile(
        r"(room_options)\s+LIKE\s+'%([^%']+)%'",
        _re2.IGNORECASE
    )
    def _wrap(m2):
        col2 = m2.group(1)
        kw2  = m2.group(2).lower().strip()
        for keywords, kor, eng in _OPTION_ALIASES:
            if kw2 in [k.lower() for k in keywords]:
                if kor.lower() == eng.lower():
                    return m2.group(0)
                return f"({col2} LIKE '%{kor}%' OR {col2} LIKE '%{eng}%')"
        return m2.group(0)
    return pattern.sub(_wrap, sql)

def _build_messages(prompt: str, history: list[dict], user_id: str | None, system_prompt: str | None = None) -> list[dict]:
    system = system_prompt or _SYSTEM_PROMPT_TEMPLATE.format(today=__import__("datetime").date.today().strftime("%Y-%m-%d"), DB_SCHEMA=DB_SCHEMA)
    if user_id:
        system += f"\n\n[현재 로그인 사용자 ID: {user_id}]"
        system += "\n★ 공용공간/헬스/라운지/회의실/스터디룸 언급 즉시 → query_my_data(계약 빌딩 조회) → query_database(공간 목록) 순서로 실행. 되묻기 금지."
        system += "\n★ 납부금액/내 계약/내 예약 요청 시 반드시 query_my_data 먼저 실행"
    else:
        system += "\n\n[현재 비로그인 상태]"
        system += "\n★ query_my_data 절대 사용 금지. 공용공간/내 계약/결제 요청 시 '로그인 후 이용 가능합니다' 안내만 할 것."

    # 진행 중인 의도 감지 → 시스템 프롬프트에 힌트 주입
    ongoing = _detect_ongoing_intent(history)
    if ongoing and ongoing in _ONGOING_INTENT_HINT:
        system += f"\n\n{_ONGOING_INTENT_HINT[ongoing]}"

    messages = [{"role": "system", "content": system}]
    for msg in (history or [])[-8:]:
        role    = msg.get("role", "")
        content = (msg.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": prompt})
    return messages


def _to_openai_tools(tool_defs: list[dict]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name":        t["name"],
                "description": t["description"],
                "parameters":  t["parameters"],
            },
        }
        for t in tool_defs
    ]


import re as _re

def _clean_function_call_text(text: str) -> str:
    """
    LLM이 tool call을 텍스트로 섞어 반환한 경우 해당 부분을 제거.
    """
    if not text:
        return text

    # [UNI PLACE AI] / [AI] / [챗봇] 등 접두어 제거
    text = _re.sub(r"^\s*\[(?:UNI PLACE AI|UNI PLACE|AI|챗봇|어시스턴트)\]\s*", "", text)

    # <think>...</think> reasoning 블록 제거 (DeepSeek, QwQ 등 reasoning 모델)
    text = _re.sub(r"<think>.*?</think>", "", text, flags=_re.DOTALL)

    # "버튼:" / "버튼 :" / "Button:" 등 __BUTTONS__ 앞의 레이블 텍스트 제거
    text = _re.sub(r'(?i)(버튼\s*:|button\s*:|링크\s*:)\s*', '', text)

    # <function_calls>...</function_calls> 블록 전체 제거
    text = _re.sub(r"<function_calls>.*?</function_calls>", "", text, flags=_re.DOTALL)

    # <function>이름</function>{...}</function> 형식 제거
    text = _re.sub(r"<function>[^<]*</function>\s*\{.*?\}</function>", "", text, flags=_re.DOTALL)

    # <function=이름>{...}</function> 형식 제거
    text = _re.sub(r"<function=[^>]*>\s*\{.*?\}\s*</function>", "", text, flags=_re.DOTALL)

    # 남은 <function...> 태그 제거
    text = _re.sub(r"</?function[^>]*>", "", text)

    # [{"response": "..."}] 형태의 단순 응답 JSON 제거 후 텍스트 추출
    resp_match = _re.search(r'\[\s*\{\s*"response"\s*:\s*"([^"]*)"\s*\}\s*\]', text)
    if resp_match:
        text = resp_match.group(1)

    # JSON 배열 형태 tool call 텍스트 제거
    # 예: [{"name": "query_database", "parameters": {...}}]
    # 또는 ```json\n[...]\n```
    text = _re.sub(r"```(?:json)?\s*\[\s*\{\s*\"name\".*?\]\s*```", "", text, flags=_re.DOTALL)
    text = _re.sub(r"^\s*\[\s*\{\s*\"name\"\s*:\s*\"(?:query_database|query_my_data|get_tour_available_slots|classify_complain_priority)\".*?\]\s*$", "", text, flags=_re.DOTALL | _re.MULTILINE)

    return text.strip()


def _is_tool_call_json(text: str) -> bool:
    """답변이 tool call JSON 배열인지 감지 (버튼 JSON은 제외)."""
    stripped = text.strip()
    if not (stripped.startswith("[") and stripped.endswith("]")):
        return False
    try:
        import json as _j
        parsed = _j.loads(stripped)
        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
            first = parsed[0]
            # 버튼 JSON은 "label"+"url" 키를 가짐 → tool call 아님
            if "label" in first and "url" in first:
                return False
            # tool call JSON은 "name"+"parameters"/"arguments" 키를 가짐
            return "name" in first and ("parameters" in first or "arguments" in first)
    except Exception:
        pass
    return False