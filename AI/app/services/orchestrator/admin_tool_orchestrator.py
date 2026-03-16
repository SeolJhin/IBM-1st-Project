# app/services/orchestrator/admin_tool_orchestrator.py
"""
어드민 전용 AI Tool Calling Orchestrator.

[일반 챗봇과의 차이]
- 모든 테이블 제한 없이 조회 가능 (user_id 필터 불필요)
- 어드민 전용 분석 도구: admin_stats
- 웹 검색 도구: web_search (Tavily — 무료 1000회/월)
- RAG 검색 도구: rag_search (ChromaDB — 완전 무료 로컬)
- 시스템 프롬프트: 운영/관리 맥락

[보안 전제]
- 이 오케스트레이터는 Spring /ai/chat/admin-chatbot 엔드포인트에서만 호출
- 해당 엔드포인트는 @PreAuthorize("hasRole('ADMIN')") 보호
- Python 서버는 내부망 전용이므로 인터넷 직접 노출 없음
"""
import json
import logging
import re

from openai import OpenAI, RateLimitError

from app.config.settings import settings
from app.schemas.ai_request import AiRequest
from app.schemas.ai_response import AiResponse
from app.services.tools.db_schema import DB_SCHEMA
from app.services.tools.tool_executor import execute_tool
from app.services.tools.tool_result_formatter import format_tool_result
from app.services.tools.web_search_tool import (
    WEB_SEARCH_TOOL_DEFINITION,
    execute_web_search,
    format_web_search_result,
)
from app.services.rag.chroma_rag import (
    RAG_SEARCH_TOOL_DEFINITION,
    execute_rag_search,
    is_rag_available,
)
from app.services.document.payment_summary_doc import make_payment_summary
from app.services.document.order_form_generator import generate_billing_report
from app.services.tools.nearby_property_tool import (
    NEARBY_PROPERTY_TOOL_DEFINITION,
    execute_nearby_property_search,
    format_nearby_property_result,
)

logger = logging.getLogger(__name__)

# ── 어드민 전용 Tool Definitions ───────────────────────────────────────────────

_BASE_TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": (
                "DB를 SQL로 조회합니다. 어드민은 모든 테이블 접근 가능. "
                "user_id 필터 없이 전체 데이터 조회 가능."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "실행할 SELECT SQL. 반드시 SELECT로 시작. LIMIT 50 포함."
                    },
                    "description": {
                        "type": "string",
                        "description": "이 쿼리가 무엇을 조회하는지 한 줄 설명"
                    }
                },
                "required": ["sql"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "admin_stats",
            "description": (
                "운영 통계를 조회합니다. "
                "period: today/week/month/all, "
                "metric: reservations/contracts/complaints/payments/occupancy/unpaid_charges"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "metric": {
                        "type": "string",
                        "enum": ["reservations", "contracts", "complaints", "payments", "occupancy", "unpaid_charges"],
                        "description": "조회할 통계 지표"
                    },
                    "period": {
                        "type": "string",
                        "enum": ["today", "week", "month", "all"],
                        "description": "집계 기간"
                    },
                    "building_id": {
                        "type": "integer",
                        "description": "특정 빌딩 필터 (선택)"
                    }
                },
                "required": ["metric", "period"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "classify_complain_priority",
            "description": "민원 내용을 분석해 우선순위(high/medium/low)를 분류합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "complain_text": {
                        "type": "string",
                        "description": "민원 내용 전문"
                    }
                },
                "required": ["complain_text"]
            }
        }
    },
    # ── 웹 검색 (Tavily) ───────────────────────────────────────────
    WEB_SEARCH_TOOL_DEFINITION,
    # ── RAG 문서 검색 (ChromaDB) ───────────────────────────────────
    RAG_SEARCH_TOOL_DEFINITION,
    # ── 주변 부동산 매물 조회 (가격 추천용) ─────────────────────────
    NEARBY_PROPERTY_TOOL_DEFINITION,
]


def _get_tool_definitions() -> list:
    """RAG 사용 가능 여부에 따라 tool 목록 동적 반환."""
    return _BASE_TOOL_DEFINITIONS


# ── 어드민 시스템 프롬프트 ─────────────────────────────────────────────────────

_ADMIN_SYSTEM_PROMPT_TEMPLATE = """당신은 UNI PLACE 운영팀 전용 AI 어시스턴트입니다.
오늘 날짜: {today}. 날짜 관련 답변 시 반드시 오늘 날짜 기준으로 작성하세요.
현재 로그인 관리자: {admin_id}

[권한]
- 모든 테이블 조회 가능 (user_id 필터 불필요)
- 입주자 계약·결제·민원·예약 전체 데이터 접근 가능
- 운영 통계 조회 가능
- 인터넷 검색 가능 (Tavily)
- 내부 문서 검색 가능 (RAG)

[사용 가능한 도구]
1. query_database       — 임의 SELECT SQL 실행 (모든 테이블, LIMIT 50)
2. admin_stats          — 운영 통계 조회 (예약수/계약수/민원수/결제/점유율/미납현황)
3. classify_complain_priority — 민원 우선순위 분류
4. web_search           — 외부 인터넷 검색 (부동산 시세, 법령, 뉴스 등)
5. rag_search           — 내부 문서 검색 (규정, FAQ, 매뉴얼 등)
6. nearby_property_search — 주변 3km 부동산 매물 수집 → 임대료 추천

[도구 선택 기준]
- "오늘 예약 몇 건?" → admin_stats(metric=reservations, period=today)
- "이번 달 민원 현황" → admin_stats(metric=complaints, period=month)
- "점유율 확인" → admin_stats(metric=occupancy, period=all)
- "결제 문서/결제 내역 문서/건물별 결제/각 건물 결제/결제 리포트/결제 보고서/결제 내역 생성/한달 결제/이번달 결제" →
  ★ 이 요청은 백엔드에서 자동 처리됩니다. LLM이 직접 처리하지 말고 반드시 아래 문구만 출력:
  "결제 내역 리포트를 생성하겠습니다. 어느 건물, 몇 월 데이터로 만들까요? (예: 전체 빌딩 이번달 / Uniplace A 3월)"
  ★ 절대 query_database 호출 금지. 절대 직접 문서 생성 시도 금지.

- "미납자/미납 현황/미납 목록/연체 현황/연체자/전체 미납" → admin_stats(metric=unpaid_charges, period=all)
  ★ period=all 반드시 사용. today/week 절대 금지.
  결과: 미납자 이름·건물·호수·미납 월 목록·합계금액 실제 DB 데이터로 출력 (환각 금지)
  답변 끝에 반드시: __BUTTONS__[{{"label":"월세 청구 관리","url":"/admin/pay/billings","icon":"🏠"}}]
- "이번달 미납자/이번 달 미납" → admin_stats(metric=unpaid_charges, period=month)
  ★ period=month 사용. 오늘({today}) 기준 이번달 billing_dt만 필터
- "특정 유저 계약 조회" → query_database (user_id 조건 없이도 가능)
- "회원 수/전체 회원/가입자 수/몇 명 가입" → query_database (users 테이블):
  SELECT COUNT(*) AS total_count FROM users WHERE delete_yn='N'
  ★ 테이블명은 반드시 'users' (member 아님), 컬럼명은 user_role (member_role 아님)

- "입주민 수/입주자 수/현재 입주" → query_database (contract 테이블):
  ★ 입주민 = contract_st='active'인 계약자. users 테이블이 아님. 절대 혼동 금지.
  전체 입주민 수: SELECT COUNT(DISTINCT c.user_id) AS resident_count FROM contract c WHERE c.contract_st='active'
  건물별 입주민 수: SELECT b.building_nm, COUNT(DISTINCT c.user_id) AS resident_count FROM contract c JOIN rooms r ON c.room_id=r.room_id JOIN building b ON r.building_id=b.building_id WHERE c.contract_st='active' GROUP BY b.building_id, b.building_nm ORDER BY b.building_nm
- "민원 텍스트 분석" → classify_complain_priority
- "서울 평균 월세" / "부동산 관련 법령" / "최신 뉴스" → web_search
- "계약 규정" / "이용 약관" / "서비스 안내 문서" → rag_search
- "방 적정 임대료 / 가격 추천 / 월세 추천 / 시세 분석 / 매물 가격 비교" → 아래 절차 수행:
  ★ 건물명+호실이 모두 있으면: 즉시 Step1 → Step2 실행.
  ★ 건물명만 있고 호실이 없으면: "어떤 호실의 가격을 추천해 드릴까요?" 라고 1번만 질문.
  ★ 추가 정보(현재 월세, 평수 등)를 따로 물어보는 것은 금지 — DB에서 자동 조회.
  ├ Step1: query_database → SELECT r.room_id, r.room_no, r.room_type, r.rent_type, r.room_size, r.rent_price, r.deposit, b.building_addr, b.building_nm FROM rooms r JOIN building b ON r.building_id=b.building_id WHERE r.room_no='[호수]' AND b.building_nm LIKE '%[건물명]%' AND r.delete_yn='N' LIMIT 1
  ├ Step2: nearby_property_search → address=building_addr, room_type=room_type, rent_type=rent_type(없으면 monthly_rent), room_size_sqm=room_size, current_price_wan=rent_price(만원단위), room_id=room_id
  └ nearby_property_search는 Python 서버가 직방·MOLIT를 직접 조회해 결과를 반환하므로 그대로 출력.
- 복잡한 집계/JOIN → query_database로 직접 SQL 작성
- "재고/룸서비스 재고/상품 재고/재고 현황" → query_database (product_building_stock, 건물별 전체 출력)
- "아메리카노/라떼/샌드위치 재고" 등 특정 상품 → query_database (한글+영문 OR LIKE)
- "배너 개수/배너 현황/배너 조회" → query_database:
  SELECT COUNT(*) AS total, SUM(CASE WHEN ban_st='active' THEN 1 ELSE 0 END) AS active_count FROM banner
  목록: SELECT ban_id, ban_title, ban_st, start_at, end_at FROM banner ORDER BY ban_order ASC LIMIT 50
  답변 끝: __BUTTONS__[{{"label":"배너 관리","url":"/admin/system/banners","icon":"🖼️"}}]
- "제휴 개수/제휴업체 조회/제휴사" → query_database:
  SELECT a.affiliate_id, a.affiliate_nm, b.building_nm FROM affiliate a JOIN building b ON a.building_id=b.building_id WHERE b.delete_yn='N' ORDER BY b.building_nm LIMIT 50
  답변 끝: __BUTTONS__[{{"label":"제휴업체 관리","url":"/admin/system/affiliates","icon":"🤝"}}]
- "회사정보/회사 정보 조회" → query_database:
  SELECT company_nm, company_ceo, company_tel, company_email, company_addr FROM company_info LIMIT 1
  답변 끝: __BUTTONS__[{{"label":"회사정보 관리","url":"/admin/system/company_info","icon":"🏢"}}]
- "재고 부족/재고 없는/품절/재고 5개 미만" → query_database:
  SELECT b.building_nm, p.prod_nm, pbs.stock
  FROM product_building_stock pbs
  JOIN building b ON pbs.building_id=b.building_id
  JOIN product p ON pbs.prod_id=p.prod_id
  WHERE b.delete_yn='N' AND pbs.stock < 5
  ORDER BY b.building_nm, pbs.stock ASC LIMIT 50
  품절만: WHERE b.delete_yn='N' AND pbs.stock=0
  ★ product_building_stock 컬럼: stock_id, prod_id, building_id, stock, updated_at
    prod_nm은 product 테이블에 있음 (반드시 JOIN product p ON pbs.prod_id=p.prod_id)
  답변: 건물별로 묶어 표 형식, stock=0이면 ⛔품절 표시
  답변 끝: __BUTTONS__[{{"label":"룸서비스 상품 관리","url":"/admin/roomservice/room_products","icon":"📦"}}]
- "재고 편집/상품 수정/상품 관리 페이지/재고 페이지/재고 조회 페이지/재고 현황 페이지" → 도구 없이 바로 버튼 안내:
  재고 현황은 아래 페이지에서 확인하실 수 있습니다.
  __BUTTONS__[{{"label":"룸서비스 상품 관리","url":"/admin/roomservice/room_products","icon":"📦"}}]
  ★ RAG/DB 검색 절대 금지. 즉시 버튼만 출력.
- "오늘 날씨/기온/날씨 검색" → web_search(topic=weather)

[SQL 규칙]
- SELECT만 허용, INSERT/UPDATE/DELETE/DROP 절대 금지
- 반드시 LIMIT 50 포함
- 빌딩명은 영문: Uniplace A / Uniplace B / Uniplace C
- building/rooms 조회 시 WHERE delete_yn='N' 포함
- 방 옵션 검색: r.room_options LIKE '%aircon%' OR r.room_options LIKE '%에어컨%'

[룸서비스 재고 조회 규칙]
★ "재고 현황/룸서비스 재고/상품 재고" 요청 시 → 건물별로 전체 재고를 반드시 조회:
  SQL: SELECT b.building_nm, p.prod_nm, pbs.stock FROM product_building_stock pbs JOIN building b ON pbs.building_id=b.building_id JOIN product p ON pbs.prod_id=p.prod_id WHERE b.delete_yn='N' ORDER BY b.building_nm, p.prod_nm LIMIT 50
  → 결과를 건물별로 묶어서 표 형식으로 출력. stock=0이면 ⚠️(품절) 표시.

★ 특정 상품 재고 조회 시 → 한글/영문 모두 OR로 검색:
  SQL: SELECT b.building_nm, p.prod_nm, pbs.stock FROM product_building_stock pbs JOIN building b ON pbs.building_id=b.building_id JOIN product p ON pbs.prod_id=p.prod_id WHERE (p.prod_nm LIKE '%한글명%' OR p.prod_nm LIKE '%영문명%') AND b.delete_yn='N' ORDER BY b.building_nm LIMIT 50

★ 상품명 한글↔영문 매핑 (DB는 영문 저장, 한글로 질문해도 반드시 영문 LIKE 사용):
  아메리카노/americano    → 'Americano'
  라떼/카페라떼/latte     → 'Latte'
  샌드위치/sandwich       → 'Sandwich'
  룸클리닝/룸청소/청소서비스/room cleaning → 'Room Cleaning'
  세탁서비스/laundry      → 'Laundry Service'
  컵라면/신라면/라면      → '컵라면' OR '신라면' OR '라면' (한글로도 저장 가능)
  생수                    → '생수'
  도시락/비빔밥           → '도시락'
  세탁세제/리큐           → '세탁세제'
  화장지/휴지             → '화장지'
  주방세제/퐁퐁           → '주방세제'
  청소포/물걸레           → '청소포'

★ 한글로 질문 → 한글 + 영문 LIKE 둘 다 포함:
  예) "아메리카노 재고" →
  WHERE (p.prod_nm LIKE '%아메리카노%' OR p.prod_nm LIKE '%Americano%' OR p.prod_nm LIKE '%americano%')
  예) "라떼 재고" →
  WHERE (p.prod_nm LIKE '%라떼%' OR p.prod_nm LIKE '%Latte%' OR p.prod_nm LIKE '%latte%')

[어드민 페이지 안내 — 버튼 URL]
- 유저 목록: /admin/users
- 입주자 목록: /admin/users/residents
- 계약 관리: /admin/contracts
- 민원 관리: /admin/support/complain
- 결제 내역: /admin/pay/payments
- 환불 관리: /admin/pay/refunds
- 주문 내역: /admin/pay/orders
- 월세(청구) 관리: /admin/pay/billings
- 투어예약: /admin/reservations/tours
- 공용공간예약: /admin/reservations/spaces
- 건물 관리: /admin/property/buildings
- 방 관리: /admin/property/rooms
- 공용공간 관리: /admin/property/spaces
- 룸서비스 상품(재고 편집): /admin/roomservice/room_products
- 룸서비스 주문 목록: /admin/roomservice/room_orders
- 결제 내역(전체 주문): /admin/pay/payments
- 시스템 관리(배너): /admin/system/banners
- 시스템 관리(제휴): /admin/system/affiliates
- 시스템 관리(회사정보): /admin/system/company_info

[페이지 안내 패턴 — 도구 없이 즉시 버튼 출력]
★ "~페이지", "~어디야", "~가는 방법", "~바로가기", "~화면" 요청 시 → DB/RAG 검색 절대 금지. 버튼만 출력.
- 재고 조회/편집/관리 페이지     → /admin/roomservice/room_products  📦
- 룸서비스 주문 페이지           → /admin/roomservice/room_orders    🛒
- 민원 관리 페이지               → /admin/support/complain           📣
- 계약 관리 페이지               → /admin/contracts                  📝
- 유저 목록 페이지               → /admin/users                      👥
- 결제/청구 페이지               → /admin/pay/payments               💳
- 월세 청구 페이지               → /admin/pay/billings               🏠
- 환불 페이지                    → /admin/pay/refunds                💸
- 투어 예약 페이지               → /admin/reservations/tours         📅
- 공용공간 예약 페이지           → /admin/reservations/spaces        🏋️
- 건물 관리 페이지               → /admin/property/buildings         🏢
- 방 관리 페이지                 → /admin/property/rooms             🚪
- 시스템 관리/배너 관리 페이지   → /admin/system/banners             🖼️
- 제휴업체 관리 페이지           → /admin/system/affiliates          🤝
- 회사정보 관리 페이지           → /admin/system/company_info        🏢
- 주문내역/룸서비스 주문 페이지  → /admin/roomservice/room_orders    🛒

[답변 원칙]
- 데이터는 표 형식(마크다운)으로 정리
- 이상 징후 발견 시 ⚠️ 표시
- 웹 검색 결과 인용 시 출처 URL 포함
- 답변 끝에 관련 어드민 페이지 버튼 추가 가능:
  __BUTTONS__[{{"label":"버튼명","url":"/admin/경로","icon":"이모지"}}]

[DB 스키마]
{DB_SCHEMA}"""

# ── admin_stats → SQL 변환 매핑 ───────────────────────────────────────────────

_STATS_SQL = {
    # ── 예약 (room_reservation: created_at O) ─────────────────────────────
    ("reservations", "today"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE DATE(created_at) = CURDATE()",
    ("reservations", "week"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
    ("reservations", "month"):
        "SELECT COUNT(*) AS count FROM room_reservation WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())",
    ("reservations", "all"):
        "SELECT tour_st, COUNT(*) AS count FROM room_reservation GROUP BY tour_st ORDER BY count DESC",

    # ── 계약 (contract: created_at 없음 → contract_start 기준) ──────────
    ("contracts", "today"):
        "SELECT contract_st, COUNT(*) AS count FROM contract WHERE DATE(contract_start) = CURDATE() GROUP BY contract_st",
    ("contracts", "week"):
        "SELECT contract_st, COUNT(*) AS count FROM contract WHERE contract_start >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY contract_st",
    ("contracts", "month"):
        "SELECT contract_st, COUNT(*) AS count FROM contract WHERE YEAR(contract_start)=YEAR(NOW()) AND MONTH(contract_start)=MONTH(NOW()) GROUP BY contract_st",
    ("contracts", "all"):
        "SELECT contract_st, COUNT(*) AS count FROM contract GROUP BY contract_st ORDER BY count DESC",

    # ── 민원 (complain: created_at O) ─────────────────────────────────────
    ("complaints", "today"):
        "SELECT COUNT(*) AS count FROM complain WHERE DATE(created_at) = CURDATE()",
    ("complaints", "week"):
        "SELECT comp_st, importance, COUNT(*) AS count FROM complain WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY comp_st, importance ORDER BY importance DESC",
    ("complaints", "month"):
        "SELECT comp_st, importance, COUNT(*) AS count FROM complain WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW()) GROUP BY comp_st, importance ORDER BY importance DESC",
    ("complaints", "all"):
        "SELECT comp_st, importance, COUNT(*) AS count FROM complain GROUP BY comp_st, importance ORDER BY importance DESC",

    # ── 결제 (payment: created_at 없음 → paid_at 기준) ───────────────────
    ("payments", "today"):
        "SELECT COUNT(*) AS count, IFNULL(SUM(captured_price),0) AS total FROM payment WHERE DATE(paid_at) = CURDATE() AND payment_st='paid'",
    ("payments", "week"):
        "SELECT COUNT(*) AS count, IFNULL(SUM(captured_price),0) AS total FROM payment WHERE paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND payment_st='paid'",
    ("payments", "month"):
        "SELECT COUNT(*) AS count, IFNULL(SUM(captured_price),0) AS total FROM payment WHERE YEAR(paid_at)=YEAR(NOW()) AND MONTH(paid_at)=MONTH(NOW()) AND payment_st='paid'",
    ("payments", "all"):
        "SELECT payment_st, COUNT(*) AS count, IFNULL(SUM(captured_price),0) AS total FROM payment GROUP BY payment_st ORDER BY count DESC",

    # ── 점유율 (기간 무관 — 현재 상태 기준) ─────────────────────────────
    ("occupancy", "all"):
        """SELECT b.building_nm,
                  COUNT(r.room_id) AS total_rooms,
                  SUM(CASE WHEN r.room_st='contracted' THEN 1 ELSE 0 END) AS contracted,
                  SUM(CASE WHEN r.room_st='available' THEN 1 ELSE 0 END) AS available,
                  ROUND(SUM(CASE WHEN r.room_st='contracted' THEN 1 ELSE 0 END) * 100.0 / COUNT(r.room_id), 1) AS occupancy_rate
           FROM rooms r JOIN building b ON r.building_id = b.building_id
           WHERE r.delete_yn='N' AND b.delete_yn='N'
           GROUP BY b.building_id, b.building_nm
           ORDER BY occupancy_rate DESC""",

    # ── 미납 현황 (monthly_charge: charge_st='unpaid') ─────────────────
    # all: 전체 미납자 목록 (user_nm 포함, 사람별 합산)
    ("unpaid_charges", "all"):
        """SELECT u.user_nm, c.user_id, b.building_nm, r.room_no,
                  GROUP_CONCAT(CONCAT(mc.billing_dt,'(',mc.charge_type,')') ORDER BY mc.billing_dt SEPARATOR ', ') AS unpaid_months,
                  IFNULL(SUM(mc.price), 0) AS total_unpaid
           FROM monthly_charge mc
           JOIN contract c ON mc.contract_id = c.contract_id
           JOIN rooms r ON c.room_id = r.room_id
           JOIN building b ON r.building_id = b.building_id
           JOIN users u ON c.user_id = u.user_id
           WHERE mc.charge_st = 'unpaid'
           GROUP BY c.user_id, u.user_nm, b.building_nm, r.room_no
           ORDER BY total_unpaid DESC
           LIMIT 50""",
    # today/month: 이번달 기준 미납자 목록
    ("unpaid_charges", "today"):
        """SELECT u.user_nm, c.user_id, b.building_nm, r.room_no,
                  mc.billing_dt, mc.charge_type, mc.price
           FROM monthly_charge mc
           JOIN contract c ON mc.contract_id = c.contract_id
           JOIN rooms r ON c.room_id = r.room_id
           JOIN building b ON r.building_id = b.building_id
           JOIN users u ON c.user_id = u.user_id
           WHERE mc.charge_st = 'unpaid'
             AND mc.billing_dt = DATE_FORMAT(NOW(), '%Y-%m')
           ORDER BY mc.price DESC
           LIMIT 50""",
    ("unpaid_charges", "week"):
        """SELECT u.user_nm, c.user_id, b.building_nm, r.room_no,
                  mc.billing_dt, mc.charge_type, mc.price
           FROM monthly_charge mc
           JOIN contract c ON mc.contract_id = c.contract_id
           JOIN rooms r ON c.room_id = r.room_id
           JOIN building b ON r.building_id = b.building_id
           JOIN users u ON c.user_id = u.user_id
           WHERE mc.charge_st = 'unpaid'
           ORDER BY mc.billing_dt ASC
           LIMIT 50""",
    ("unpaid_charges", "month"):
        """SELECT u.user_nm, c.user_id, b.building_nm, r.room_no,
                  mc.billing_dt, mc.charge_type, mc.price
           FROM monthly_charge mc
           JOIN contract c ON mc.contract_id = c.contract_id
           JOIN rooms r ON c.room_id = r.room_id
           JOIN building b ON r.building_id = b.building_id
           JOIN users u ON c.user_id = u.user_id
           WHERE mc.charge_st = 'unpaid'
             AND mc.billing_dt = DATE_FORMAT(NOW(), '%Y-%m')
           ORDER BY mc.price DESC
           LIMIT 50""",
}

for _m in ["reservations", "contracts", "complaints", "payments"]:
    for _p in ["today", "week", "month", "all"]:
        if (_m, _p) not in _STATS_SQL:
            _STATS_SQL[(_m, _p)] = _STATS_SQL.get((_m, "all"), f"SELECT COUNT(*) FROM {_m}")
for _p in ["today", "week", "month"]:
    _STATS_SQL[("occupancy", _p)] = _STATS_SQL[("occupancy", "all")]


def _handle_admin_stats(args: dict, admin_user_id: str, tool_call_id: str) -> dict:
    """admin_stats 도구 → SQL 실행 후 tool_result 반환."""
    metric    = args.get("metric", "reservations")
    period    = args.get("period", "all")
    building_id = args.get("building_id")

    # ★ unpaid_charges: 기간 미지정 또는 today/week → all로 강제 (전체 미납 목록)
    # month는 이번달 미납자 조회이므로 유지
    if metric == "unpaid_charges" and period in ("today", "week"):
        period = "all"

    base_sql = _STATS_SQL.get((metric, period), f"SELECT COUNT(*) AS count FROM {metric}")

    if building_id:
        if "WHERE" in base_sql.upper():
            base_sql = base_sql.rstrip() + f" AND building_id = {int(building_id)}"
        else:
            base_sql = base_sql.rstrip() + f" WHERE building_id = {int(building_id)}"

    if "LIMIT" not in base_sql.upper():
        base_sql += " LIMIT 50"

    result = execute_tool(
        tool_name="query_database_admin",
        tool_args={"sql": base_sql, "description": f"{metric} 통계 ({period})"},
        user_id=admin_user_id,
    )
    return {"role": "tool", "tool_call_id": tool_call_id, "content": json.dumps(result, ensure_ascii=False)}


# ── Fallback 모델 ─────────────────────────────────────────────────────────────

_GROQ_FALLBACK = [
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
]

_GEMINI_FALLBACK = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]


def _build_candidates(start_model: str) -> list[str]:
    candidates = [start_model]
    for m in _GROQ_FALLBACK:
        if m != start_model:
            candidates.append(m)
    return candidates


def _build_gemini_candidates(start_model: str) -> list[str]:
    seen = set()
    result = []
    for m in [start_model] + _GEMINI_FALLBACK:
        if m not in seen:
            seen.add(m)
            result.append(m)
    return result


def _call_with_fallback(client, provider: str, start_model: str, kwargs: dict):
    if provider == "groq":
        candidates = _build_candidates(start_model)
    elif provider == "gemini":
        candidates = _build_gemini_candidates(start_model)
    else:
        candidates = [start_model]
    last_err = None
    for model in candidates:
        try:
            resp = client.chat.completions.create(model=model, **kwargs)
            return resp, model
        except RateLimitError as e:
            logger.warning("[AdminOrchestrator] RateLimit model=%s: %s", model, e)
            last_err = e
        except Exception as e:
            logger.warning("[AdminOrchestrator] 호출 실패 model=%s: %s", model, e)
            last_err = e
    return None, start_model


# ── 메인 함수 ─────────────────────────────────────────────────────────────────

def run_admin_tool_orchestrator(req: AiRequest) -> AiResponse:
    """어드민 챗봇 단일 진입점."""
    prompt = (req.prompt or "").strip()
    if not prompt:
        return AiResponse(answer="관리자 AI에게 무엇을 질문하시겠어요?", confidence=1.0)

    admin_id = req.user_id or (req.slots or {}).get("userId") or "unknown"
    provider = (settings.llm_provider or "groq").lower()

    logger.info("[AdminOrchestrator] request admin_id=%s", admin_id)

    try:
        slots = req.slots or {}
        return _run_admin(prompt, req.get_history(), admin_id, provider, slots=slots, req=req)
    except Exception as e:
        logger.error("[AdminOrchestrator] 처리 실패: %s", e, exc_info=True)
        return AiResponse(
            answer="일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            confidence=0.0,
        )


# ── 페이지 요청 감지 테이블 ──────────────────────────────────────────────────
_PAGE_REQUEST_MAP = [
    # (키워드 목록, 버튼 레이블, URL, 아이콘)
    (["재고조회", "재고 조회", "재고현황", "재고 현황", "재고편집", "재고 편집",
      "상품관리", "상품 관리", "룸서비스상품", "룸서비스 상품"],
     "룸서비스 상품 관리", "/admin/roomservice/room_products", "📦"),

    (["룸서비스주문", "룸서비스 주문", "주문목록", "주문 목록", "룸서비스주문목록"],
     "룸서비스 주문 목록", "/admin/roomservice/room_orders", "🛒"),

    (["민원관리", "민원 관리", "민원목록", "민원 목록", "민원페이지", "민원 페이지"],
     "민원 관리", "/admin/support/complain", "📣"),

    (["계약관리", "계약 관리", "계약목록", "계약 목록", "계약페이지"],
     "계약 관리", "/admin/contracts", "📝"),

    (["유저목록", "유저 목록", "회원목록", "회원 목록", "사용자목록", "사용자 목록"],
     "유저 목록", "/admin/users", "👥"),

    (["결제내역", "결제 내역", "결제현황", "결제 현황", "결제페이지", "결제관리"],
     "결제 내역", "/admin/pay/payments", "💳"),

    (["월세청구", "월세 청구", "청구관리", "청구 관리", "월세관리", "월세 관리", "billings"],
     "월세 청구 관리", "/admin/pay/billings", "🏠"),

    (["환불관리", "환불 관리", "환불목록", "환불 목록", "환불페이지"],
     "환불 관리", "/admin/pay/refunds", "💸"),

    (["투어예약", "투어 예약", "투어관리", "투어목록"],
     "투어 예약 목록", "/admin/reservations/tours", "📅"),

    (["공용공간예약", "공용공간 예약", "공간예약", "공간 예약"],
     "공용공간 예약 목록", "/admin/reservations/spaces", "🏋️"),

    (["건물관리", "건물 관리", "건물목록", "건물 목록"],
     "건물 관리", "/admin/property/buildings", "🏢"),

    (["방관리", "방 관리", "방목록", "방 목록", "room관리"],
     "방 관리", "/admin/property/rooms", "🚪"),

    (["배너관리", "배너 관리", "배너목록", "배너 목록", "배너페이지", "배너 페이지"],
     "배너 관리", "/admin/system/banners", "🖼️"),

    (["제휴관리", "제휴 관리", "제휴업체", "제휴 업체", "affiliate"],
     "제휴업체 관리", "/admin/system/affiliates", "🤝"),

    (["회사정보", "회사 정보", "회사관리", "회사 관리", "company"],
     "회사정보 관리", "/admin/system/company_info", "🏢"),

    (["주문내역", "주문 내역", "룸서비스주문", "룸서비스 주문목록"],
     "룸서비스 주문 목록", "/admin/roomservice/room_orders", "🛒"),

    (["시스템관리", "시스템 관리"],
     "시스템 관리", "/admin/system/banners", "⚙️"),
]

# 페이지 요청 트리거 접미사
_PAGE_SUFFIXES = ["페이지", "page", "화면", "바로가기", "이동", "가기", "어디야", "어디", "링크"]


def _detect_page_request(prompt: str) -> tuple[str, str, str] | None:
    """
    '재고조회페이지', '민원관리 페이지' 등 페이지 이동 요청 감지.
    매칭되면 (label, url, icon) 반환, 아니면 None.
    """
    p = prompt.strip().replace(" ", "")  # 공백 제거 후 비교
    p_orig = prompt.strip().lower()

    for keywords, label, url, icon in _PAGE_REQUEST_MAP:
        for kw in keywords:
            kw_no_space = kw.replace(" ", "")
            # 1) 키워드 + 페이지 접미사 조합
            for suf in _PAGE_SUFFIXES:
                if kw_no_space + suf in p or kw_no_space + suf in p_orig.replace(" ", ""):
                    return label, url, icon
            # 2) 프롬프트가 키워드 단독인 경우 (공백 무관)
            if p == kw_no_space or p_orig == kw.lower():
                # 단순 명사 요청인지 확인 (5글자 이하 단독 키워드는 제외 — 오탐 방지)
                if len(kw_no_space) >= 4:
                    return label, url, icon
    return None



# ── 재고 부족 등 직접 SQL 강제 실행 패턴 ────────────────────────────────────
_LOW_STOCK_SQL = (
    "SELECT b.building_nm, p.prod_nm, pbs.stock "
    "FROM product_building_stock pbs "
    "JOIN building b ON pbs.building_id = b.building_id "
    "JOIN product p ON pbs.prod_id = p.prod_id "
    "WHERE b.delete_yn = 'N' AND pbs.stock < 5 "
    "ORDER BY b.building_nm, pbs.stock ASC LIMIT 50"
)
_LOW_STOCK_KEYWORDS = [
    "재고부족", "재고 부족", "재고없는", "재고 없는", "품절상품", "품절 상품",
    "부족한재고", "부족한 재고", "재고알려", "재고 알려", "재고가부족", "재고가 부족",
]
_LOW_STOCK_BUTTONS = [{"label": "룸서비스 상품 관리", "url": "/admin/roomservice/room_products", "icon": "📦"}]


def _detect_low_stock_request(prompt: str) -> bool:
    p = prompt.strip().replace(" ", "").lower()
    return any(kw.replace(" ", "").lower() in p for kw in _LOW_STOCK_KEYWORDS)


def _run_admin(prompt: str, history: list[dict], admin_id: str, provider: str, slots: dict = None, req: AiRequest = None) -> AiResponse:
    slots = slots or {}
    # nearby_property_search는 이제 Python 서버 자체에서 직방/MOLIT 호출 → market_data 불필요
    _market_data    = slots.get("market_data")    # 구버전 호환용 (있으면 그대로 사용)
    _nearby_request = slots.get("nearby_request") # 구버전 호환용
    # 가격 추천 요청 여부 (query_database 후 nearby_property_search 강제 실행 판단)
    _is_price_query = bool(re.search(
        r"가격\s*추천|월세\s*추천|임대료\s*추천|적정\s*가격|적정\s*월세|시세\s*분석|시세\s*비교|가격\s*분석|적정가",
        prompt
    ))
    import datetime as _dt

    # ── 빌딩별 결제 내역 리포트 (LLM 호출 전) ──────────────────────────────────
    _is_billing_report = bool(re.search(
        r"빌딩별\s*결제|건물별\s*결제|각\s*건물|각\s*빌딩"
        r"|결제\s*내역\s*문서|결제\s*리포트|결제\s*보고서"
        r"|결제\s*내역\s*생성|결제\s*문서\s*생성|결제\s*내역\s*만들|결제\s*문서\s*만들"
        r"|결제\s*문서\s*생성해|전체\s*결제\s*문서|건물\s*결제\s*문서"
        r"|월별\s*결제|결제\s*현황\s*문서|청구\s*내역\s*문서"
        r"|billing\s*report|1달\s*결제|한달\s*결제|이번달\s*결제|전체\s*결제\s*내역",
        prompt, re.IGNORECASE
    ))
    if _is_billing_report:
        logger.info("[AdminOrchestrator] ★ 빌딩별 결제 리포트 생성")
        try:
            # 월 파싱
            _month_m  = re.search(r"(\d{4})[-년]\s*(\d{1,2})", prompt)
            _month_m2 = re.search(r"(\d{1,2})월", prompt)
            if _month_m:
                _target_month = "%s-%02d" % (int(_month_m.group(1)), int(_month_m.group(2)))
            elif _month_m2:
                _target_month = "%s-%02d" % (_dt.date.today().year, int(_month_m2.group(1)))
            else:
                _target_month = None  # 이번달

            # 빌딩명 파싱
            _bld_map = {
                "A동": "Uniplace A", "B동": "Uniplace B", "C동": "Uniplace C",
                "유니플레이스 A": "Uniplace A", "유니플레이스 B": "Uniplace B", "유니플레이스 C": "Uniplace C",
                "Uniplace A": "Uniplace A", "Uniplace B": "Uniplace B", "Uniplace C": "Uniplace C",
            }
            _target_bld = None
            for k, v in _bld_map.items():
                if k in prompt:
                    _target_bld = v
                    break

            summary   = generate_billing_report(admin_id=admin_id, target_month=_target_month, building_nm=_target_bld)
            month_label = summary.get("month", "")
            bld_label   = (_target_bld + " ") if _target_bld else "전체 빌딩 "
            fname       = summary.get("file_name", "")
            mc_total    = summary.get("mc_total", 0)
            pay_total   = summary.get("pay_total", 0)
            grand       = summary.get("grand_total", 0)
            buildings   = ", ".join(summary.get("buildings", []))

            answer_text = (
                "✅ " + bld_label + month_label + " 결제 내역 리포트가 생성되었습니다.\n\n"
                "🏢 대상 빌딩: " + (buildings or bld_label.strip()) + "\n"
                "📋 월세·관리비: " + str(summary.get("mc_count", 0)) + "건 / " + format(mc_total, ",") + "원\n"
                "💳 기타 결제:  " + str(summary.get("pay_count", 0)) + "건 / " + format(pay_total, ",") + "원\n"
                "💰 총합계:     " + format(grand, ",") + "원\n\n"
                "📥 파일: " + fname
            )
            dl_url = summary.get("download_url", "")
            return AiResponse(
                answer=answer_text,
                confidence=0.98,
                metadata={
                    "file_name":    fname,
                    "download_url": dl_url,
                    "buttons": [
                        {"label": "📥 엑셀 다운로드", "url": "/api/ai/payment/order-form/download/" + fname, "icon": "📥"},
                        {"label": "결제 내역 관리",   "url": "/admin/pay/payments", "icon": "💳"},
                    ],
                },
            )
        except Exception as _e:
            logger.error("[AdminOrchestrator] 빌딩 결제 리포트 실패: %s", _e, exc_info=True)
            return AiResponse(
                answer="결제 리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
                confidence=0.0,
            )

    # ── 결제 문서화 요청 강제 처리 (LLM 호출 전) ──────────────────────────────
    _is_payment_doc_query = bool(re.search(
        r"결제\s*내역\s*문서|결제\s*자동\s*문서|결제\s*문서화|발주\s*문서|결제\s*요약\s*문서|"
        r"payment\s*summary|결제\s*정리|발주서\s*정리|결제내역\s*정리|엑셀.*결제|결제.*엑셀",
        prompt, re.IGNORECASE
    ))
    if _is_payment_doc_query:
        logger.info("[AdminOrchestrator] ★ 결제 문서화 강제처리")
        try:
            _pay_req = req if req is not None else AiRequest(prompt=prompt, slots=slots or {})
            answer, meta = make_payment_summary(_pay_req)
            draft_path  = meta.get("draft_path", "")
            draft_type  = meta.get("draft_type", "")
            xlsx_fname  = meta.get("xlsx_file_name")
            dl_url      = meta.get("download_url")

            # 다운로드 안내 문구
            dl_text = ""
            if xlsx_fname:
                dl_text = f"\n\n📥 **엑셀 다운로드**: {xlsx_fname}"

            buttons = [{{"label": "결제 내역 관리", "url": "/admin/pay/payments", "icon": "💳"}}]
            if xlsx_fname:
                buttons.append({{"label": "📥 엑셀 다운로드", "url": f"/api/ai/payment/order-form/download/{xlsx_fname}", "icon": "📥"}})

            return AiResponse(
                answer=f"✅ 결제 문서가 자동 생성되었습니다.\n{answer}{dl_text}",
                confidence=0.97,
                metadata={
                    "draft_path": draft_path,
                    "draft_type": draft_type,
                    "xlsx_file_name": xlsx_fname,
                    "download_url": dl_url,
                    "buttons": buttons,
                },
            )
        except Exception as _e:
            logger.error("[AdminOrchestrator] 결제 문서화 실패: %s", _e, exc_info=True)
            return AiResponse(
                answer="결제 문서 생성 중 오류가 발생했습니다. 엑셀 파일이 data/payments/raw 폴더에 있는지 확인해 주세요.",
                confidence=0.0,
            )

    # ── 가격 추천 요청 강제 처리 (LLM 호출 전) ──────────────────────────────
    if _is_price_query:
        # 프롬프트에서 건물명/호수 파싱
        _building_map = {
            "A": "Uniplace A", "B": "Uniplace B", "C": "Uniplace C",
            "유니플레이스 A": "Uniplace A", "유니플레이스 B": "Uniplace B", "유니플레이스 C": "Uniplace C",
            "유니플A": "Uniplace A", "유니플B": "Uniplace B", "유니플C": "Uniplace C",
        }
        _building_nm = None
        for k, v in _building_map.items():
            if k in prompt:
                _building_nm = v
                break
        _room_no_m = re.search(r"(\d{3,4})\s*호", prompt)
        _room_no = _room_no_m.group(1) if _room_no_m else None

        if _building_nm and _room_no:
            logger.info("[AdminOrchestrator] ★ 가격추천 강제처리: building=%s room=%s", _building_nm, _room_no)
            _sql = (
                f"SELECT r.room_id, r.room_no, r.room_type, r.rent_type, r.room_size, "
                f"r.rent_price, r.deposit, r.floor, b.building_addr, b.building_nm "
                f"FROM rooms r JOIN building b ON r.building_id=b.building_id "
                f"WHERE r.room_no='{_room_no}' AND b.building_nm LIKE '%{_building_nm}%' "
                f"AND r.delete_yn='N' LIMIT 1"
            )
            _db_result = execute_tool(
                tool_name="query_database_admin",
                tool_args={"sql": _sql, "description": f"{_building_nm} {_room_no}호 방 정보 조회"},
                user_id=admin_id,
            )
            _rows = (_db_result.get("data") or []) if _db_result.get("success") else []
            if _rows:
                _row = _rows[0]
                _building_addr = _row.get("building_addr") or ""
                if _building_addr:
                    _rent_price_raw = _row.get("rent_price") or 0
                    try:
                        _rp = int(float(_rent_price_raw))
                        _rent_wan = _rp // 10000 if _rp > 1000 else _rp
                    except Exception:
                        _rent_wan = 0
                    _deposit_raw = _row.get("deposit") or 0
                    try:
                        _dep = int(float(_deposit_raw))
                        _deposit_wan = _dep // 10000 if _dep > 1000 else _dep
                    except Exception:
                        _deposit_wan = 0
                    _nearby_args = {
                        "address":           _building_addr,
                        "room_type":         _row.get("room_type") or "one_room",
                        "rent_type":         _row.get("rent_type") or "monthly_rent",
                        "room_size_sqm":     float(_row.get("room_size") or 0) or None,
                        "current_price_wan": _rent_wan,
                        "deposit_wan":       _deposit_wan,
                        "floor":             str(_row.get("floor") or ""),
                        "room_id":           _row.get("room_id"),
                    }
                    _property_result = execute_nearby_property_search(_nearby_args)
                    _formatted = format_nearby_property_result(_property_result)
                    logger.info("[AdminOrchestrator] ★ 가격추천 강제처리 완료 type=%s", _property_result.get("__type"))
                    return AiResponse(
                        answer=_formatted,
                        confidence=0.95,
                        metadata={"tools": ["query_database_admin", "nearby_property_search"]},
                    )

    # ── 페이지 안내 요청 강제 처리 (LLM 호출 전) ─────────────────────────────
    _page_button = _detect_page_request(prompt)
    if _page_button:
        label, url, icon = _page_button
        return AiResponse(
            answer=f"{label} 페이지로 이동하시려면 아래 버튼을 이용하세요.",
            confidence=1.0,
            metadata={"buttons": [{"label": label, "url": url, "icon": icon}]},
        )

    # ── 재고 부족 요청 강제 처리 (LLM 호출 전 — tool 미선택 오류 방지) ────────
    if _detect_low_stock_request(prompt):
        result = execute_tool(
            tool_name="query_database_admin",
            tool_args={"sql": _LOW_STOCK_SQL, "description": "재고 부족 상품 조회"},
            user_id=admin_id,
        )
        rows = result.get("data") or [] if result.get("success") else []
        if not result.get("success"):
            answer = "재고 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        elif not rows:
            answer = "✅ 현재 재고 부족(5개 미만) 상품이 없습니다. 모든 상품 재고 정상입니다."
        else:
            lines = [f"⚠️ **재고 부족 상품** (5개 미만, 총 {len(rows)}개)\n"]
            cur_b = None
            for row in rows:
                b = row.get("building_nm", "?")
                if b != cur_b:
                    lines.append(f"\n🏢 **{b}**")
                    cur_b = b
                stock = int(row.get("stock", 0))
                icon_s = "⛔ 품절" if stock == 0 else f"⚠️ {stock}개"
                lines.append(f"  • {row.get('prod_nm', '-')} ({row.get('building_nm','-')}): {icon_s}")
            answer = "\n".join(lines)
        return AiResponse(
            answer=answer,
            confidence=1.0,
            metadata={"buttons": _LOW_STOCK_BUTTONS},
        )

    system_prompt = _ADMIN_SYSTEM_PROMPT_TEMPLATE.format(
        today=_dt.date.today().strftime("%Y-%m-%d"),
        admin_id=admin_id,
        DB_SCHEMA=DB_SCHEMA,
    )

    if provider == "gemini":
        client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url=settings.gemini_base_url,
        )
        primary_model = settings.gemini_model
    elif provider == "groq":
        client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        primary_model = settings.groq_model
    else:
        client = OpenAI(api_key=settings.openai_api_key)
        primary_model = settings.openai_model

    messages = [{"role": "system", "content": system_prompt}]
    for h in (history or []):
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h.get("content", "")})
    messages.append({"role": "user", "content": prompt})

    tool_definitions = _get_tool_definitions()

    # ── Step 1: Tool 선택 ────────────────────────────────────────────────────
    resp1, used_model = _call_with_fallback(client, provider, primary_model, {
        "messages": messages,
        "tools": tool_definitions,
        "tool_choice": "auto",
        "max_tokens": 1000,
        "temperature": 0.2,
    })

    if resp1 is None:
        return AiResponse(answer="AI 서비스 일시 불가합니다.", confidence=0.0)

    choice1 = resp1.choices[0]

    if not (choice1.finish_reason == "tool_calls" and choice1.message.tool_calls):
        answer = (choice1.message.content or "").strip()
        clean, buttons = _extract_buttons(answer)
        return AiResponse(answer=clean, confidence=0.9, metadata={"buttons": buttons, "model": used_model})

    tool_calls = choice1.message.tool_calls
    logger.info("[AdminOrchestrator] tools=%s model=%s",
                [tc.function.name for tc in tool_calls], used_model)

    # ── Step 2: Tool 실행 (최대 3라운드 — query_database → nearby_property_search 연속 지원) ──
    messages.append(choice1.message)
    all_context = []
    MAX_ROUNDS = 3

    all_tool_names: list[str] = []

    for _round in range(MAX_ROUNDS):
        # 이번 라운드에서 실행할 tool_calls
        for tc in tool_calls:
            tool_name = tc.function.name
            all_tool_names.append(tool_name)
            try:
                args = json.loads(tc.function.arguments or "{}")
            except Exception:
                args = {}

            # ── 웹 검색 ─────────────────────────────────────────────────────
            if tool_name == "web_search":
                query = args.get("query", "")
                topic = args.get("topic", "general")
                logger.info("[AdminOrchestrator] web_search query=%s", query)
                search_result = execute_web_search(query, topic)
                formatted_text = format_web_search_result(search_result)
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": formatted_text})
                all_context.append(f"[web_search:{query}] {formatted_text[:200]}")

            # ── RAG 검색 ────────────────────────────────────────────────────
            elif tool_name == "rag_search":
                query = args.get("query", "")
                logger.info("[AdminOrchestrator] rag_search query=%s", query)
                rag_result = execute_rag_search(query)
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(rag_result, ensure_ascii=False)})
                all_context.append(f"[rag_search:{query}] found={rag_result.get('found')}")

            # ── 주변 부동산 매물 조회 (가격 추천) ───────────────────────────
            elif tool_name == "nearby_property_search":
                # 프론트가 이미 수집한 market_data가 있으면 args에 주입 (2단계)
                if _market_data is not None:
                    args["market_data"] = _market_data
                if _nearby_request and not args.get("address"):
                    args.update(_nearby_request)
                logger.info("[AdminOrchestrator] nearby_property_search args_keys=%s market_count=%s",
                            list(args.keys()), len(_market_data) if _market_data else 0)
                property_result = execute_nearby_property_search(args)
                formatted_text = format_nearby_property_result(property_result)
                # ★★★ 핵심: nearby_property_search 결과는 LLM에게 넘기지 않고 즉시 반환
                # LLM이 마커(__NEEDS_MARKET_DATA__ / __PRICE_REPORT__)를 무시하거나
                # "잠시만 기다려 주세요" 같은 자체 텍스트로 덮어쓰는 것을 방지
                logger.info("[AdminOrchestrator] nearby result type=%s, returning directly",
                            property_result.get("__type"))
                return AiResponse(
                    answer=formatted_text,
                    confidence=0.95,
                    metadata={"tools": all_tool_names + [tool_name], "model": used_model},
                )

            # ── admin_stats ──────────────────────────────────────────────────
            elif tool_name == "admin_stats":
                tool_msg = _handle_admin_stats(args, admin_id, tc.id)
                messages.append(tool_msg)
                all_context.append(f"[admin_stats] {tool_msg['content'][:300]}")
                # ★ admin_stats도 LLM 재호출 없이 직접 포맷해서 반환
                # LLM이 빈 content를 내놓는 경우를 방어
                try:
                    stats_data = json.loads(tool_msg["content"])
                    formatted_answer = _format_admin_stats_answer(args, stats_data)
                except Exception:
                    formatted_answer = None
                if formatted_answer:
                    all_tool_names.append(tool_name)
                    clean, buttons = _extract_buttons(formatted_answer)
                    return AiResponse(
                        answer=clean,
                        confidence=0.95,
                        metadata={"buttons": buttons, "tools": all_tool_names, "model": used_model},
                    )

            # ── query_database / classify_complain_priority ──────────────────
            else:
                if "sql" in args:
                    args["sql"] = _normalize_prod_nm_in_sql(args["sql"])
                result = execute_tool(
                    tool_name="query_database_admin" if tool_name == "query_database" else tool_name,
                    tool_args=args,
                    user_id=admin_id,
                )
                _fmt_name = "query_database" if tool_name == "query_database" else tool_name
                formatted = format_tool_result(_fmt_name, result)
                messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(formatted, ensure_ascii=False)})
                all_context.append(f"[{tool_name}] {json.dumps(formatted, ensure_ascii=False)[:300]}")

                # ★ 가격추천 컨텍스트 감지: query_database로 방 정보 조회 완료 시
                # LLM이 nearby_property_search를 건너뛰는 경우를 방어하기 위해
                # 방 정보(building_addr 포함)가 있으면 강제로 nearby_property_search 실행
                if (
                    tool_name == "query_database"
                    and _is_price_query
                    and "nearby_property_search" not in all_tool_names
                ):
                    rows = result.get("data") or [] if result.get("success") else []
                    if rows and isinstance(rows, list) and len(rows) > 0:
                        row = rows[0]
                        building_addr = row.get("building_addr") or row.get("addr") or ""
                        if building_addr:
                            logger.info("[AdminOrchestrator] ★ 가격추천 강제실행: building_addr=%s", building_addr)
                            rent_price_raw = row.get("rent_price") or 0
                            try:
                                rent_wan = int(float(rent_price_raw)) // 10000 if int(float(rent_price_raw)) > 1000 else int(float(rent_price_raw))
                            except Exception:
                                rent_wan = 0
                            nearby_args = {
                                "address":           building_addr,
                                "room_type":         row.get("room_type") or "one_room",
                                "rent_type":         row.get("rent_type") or "monthly_rent",
                                "room_size_sqm":     float(row.get("room_size") or 0) or None,
                                "current_price_wan": rent_wan,
                                "room_id":           row.get("room_id"),
                            }
                            if _market_data is not None:
                                nearby_args["market_data"] = _market_data
                            property_result = execute_nearby_property_search(nearby_args)
                            formatted_text = format_nearby_property_result(property_result)
                            logger.info("[AdminOrchestrator] ★ nearby 강제실행 결과 type=%s", property_result.get("__type"))
                            all_tool_names.append("nearby_property_search")
                            return AiResponse(
                                answer=formatted_text,
                                confidence=0.95,
                                metadata={"tools": all_tool_names, "model": used_model},
                            )

            logger.info("[AdminOrchestrator] round=%d tool=%s", _round, tool_name)

        # ── 다음 라운드: AI가 또 tool을 호출하는지 확인 ───────────────────────
        resp_next, used_model = _call_with_fallback(client, provider, used_model, {
            "messages": messages,
            "tools": tool_definitions,
            "tool_choice": "auto",
            "max_tokens": 2500,
            "temperature": 0.3,
        })

        if resp_next is None:
            return AiResponse(
                answer="조회는 완료됐으나 응답 생성 중 오류가 발생했습니다.",
                confidence=0.5,
                metadata={"context": all_context},
            )

        choice_next = resp_next.choices[0]

        # tool_calls가 없으면 최종 답변 → 반환
        if not (choice_next.finish_reason == "tool_calls" and choice_next.message.tool_calls):
            answer = (choice_next.message.content or "").strip()

            # ★ 가격추천인데 nearby_property_search를 실행 안 했고 answer가 비어있는 경우
            # → all_context에서 방 정보 추출해 강제 실행
            if _is_price_query and "nearby_property_search" not in all_tool_names:
                room_info = _extract_room_from_context(all_context)
                if room_info and room_info.get("building_addr"):
                    logger.info("[AdminOrchestrator] ★ 최종답변 단계에서 nearby 강제실행")
                    nearby_args = {
                        "address":           room_info["building_addr"],
                        "room_type":         room_info.get("room_type", "one_room"),
                        "rent_type":         room_info.get("rent_type", "monthly_rent"),
                        "room_size_sqm":     room_info.get("room_size"),
                        "current_price_wan": room_info.get("rent_wan"),
                        "room_id":           room_info.get("room_id"),
                    }
                    if _market_data is not None:
                        nearby_args["market_data"] = _market_data
                    property_result = execute_nearby_property_search(nearby_args)
                    return AiResponse(
                        answer=format_nearby_property_result(property_result),
                        confidence=0.95,
                        metadata={"tools": all_tool_names + ["nearby_property_search"], "model": used_model},
                    )

            if not answer:
                answer = "조회가 완료됐습니다."
            clean, buttons = _extract_buttons(answer)
            return AiResponse(
                answer=clean,
                confidence=0.95,
                metadata={"buttons": buttons, "tools": all_tool_names, "model": used_model},
            )

        # 다음 라운드 tool_calls 준비
        messages.append(choice_next.message)
        tool_calls = choice_next.message.tool_calls
        logger.info("[AdminOrchestrator] next round tools=%s", [tc.function.name for tc in tool_calls])

    # MAX_ROUNDS 초과 시 강제 최종 응답
    resp_final, used_model_f = _call_with_fallback(client, provider, used_model, {
        "messages": messages,
        "max_tokens": 2500,
        "temperature": 0.3,
    })
    if resp_final is None:
        return AiResponse(answer="응답 생성 오류.", confidence=0.3)
    answer = (resp_final.choices[0].message.content or "").strip()
    clean, buttons = _extract_buttons(answer)
    return AiResponse(
        answer=clean,
        confidence=0.9,
        metadata={"buttons": buttons, "tools": all_tool_names, "model": used_model_f},
    )


# 상품명(prod_nm) 한글↔영문 양방향 매핑 (어드민용)
_PROD_NAME_ALIASES: list[tuple[list[str], str, str]] = [
    (["아메리카노", "americano"],                          "아메리카노",   "Americano"),
    (["라떼", "카페라떼", "latte"],                      "라떼",         "Latte"),
    (["샌드위치", "sandwich"],                             "샌드위치",     "Sandwich"),
    (["룸청소", "룸클리닝", "room cleaning", "청소서비스"], "룸클리닝",  "Room Cleaning"),
    (["세탁서비스", "laundry", "laundry service"],        "세탁서비스",  "Laundry Service"),
    (["컵라면", "신라면", "라면"],                       "컵라면",       "컵라면"),
    (["생수", "water"],                                   "생수",         "생수"),
    (["도시락", "비빔밥"],                                "도시락",       "도시락"),
    (["세탁세제", "리큐"],                                "세탁세제",     "세탁세제"),
    (["화장지", "휴지", "toilet paper"],                 "화장지",       "화장지"),
    (["주방세제", "퐁퐁", "dish soap"],                  "주방세제",     "주방세제"),
    (["청소포", "물걸레"],                                "청소포",       "청소포"),
]


def _normalize_prod_nm_in_sql(sql: str) -> str:
    """prod_nm LIKE '%키워드%' → (prod_nm LIKE '%한글%' OR prod_nm LIKE '%영문%') 확장."""
    import re as _re_prod
    if not sql or "prod_nm" not in sql.lower():
        return sql
    pattern = _re_prod.compile(r"(prod_nm)\s+LIKE\s+'%([^%']+)%'", _re_prod.IGNORECASE)
    def _wrap(m):
        col, kw = m.group(1), m.group(2).lower().strip()
        for keywords, kor, eng in _PROD_NAME_ALIASES:
            if kw in [k.lower() for k in keywords]:
                if kor.lower() == eng.lower():
                    return m.group(0)
                return f"({col} LIKE '%{kor}%' OR {col} LIKE '%{eng}%')"
        return m.group(0)
    return pattern.sub(_wrap, sql)


def _extract_buttons(answer: str) -> tuple[str, list[dict]]:
    """일반 챗봇과 동일한 버튼 파싱 로직."""
    import re, json as _json

    buttons = []
    clean_answer = answer

    pattern1 = r'__BUTTONS__\s*(\[.*?\])'
    match = re.search(pattern1, answer, re.DOTALL)
    if match:
        try:
            parsed = _json.loads(match.group(1))
            if isinstance(parsed, list):
                buttons = [b for b in parsed if isinstance(b, dict) and b.get("url")]
        except Exception:
            pass
        clean_answer = answer[:match.start()].strip()
        return clean_answer, buttons

    pattern2 = r'<button\s+label=["\']([^"\']*)["\']\\s+url=["\']([^"\']*)["\'](?:\s+icon=["\']([^"\']*)["\'])?\s*(?:/>|>.*?</button>)'
    btn_matches = re.findall(pattern2, answer, re.DOTALL | re.IGNORECASE)
    if btn_matches:
        for label, url, icon in btn_matches:
            buttons.append({"label": label, "url": url, "icon": icon or "🔗"})
        clean_answer = re.sub(pattern2, '', answer, flags=re.DOTALL | re.IGNORECASE).strip()
        return clean_answer, buttons

    return answer.strip(), []

def _extract_room_from_context(all_context: list[str]) -> dict | None:
    """
    all_context에서 query_database 결과를 파싱해 방 정보(building_addr 등)를 추출.
    nearby_property_search 강제 실행 시 사용.
    """
    for ctx in all_context:
        if "[query_database]" not in ctx:
            continue
        try:
            # "[query_database] {json}" 형식에서 JSON 부분 추출
            json_start = ctx.index('{')
            data = json.loads(ctx[json_start:])
            rows = data.get("data") or data.get("rows") or []
            if not rows and isinstance(data.get("result"), list):
                rows = data["result"]
            if not rows:
                continue
            row = rows[0] if isinstance(rows, list) else rows
            building_addr = row.get("building_addr") or row.get("addr") or ""
            if not building_addr:
                continue
            rent_price_raw = row.get("rent_price") or 0
            try:
                rp = int(float(rent_price_raw))
                rent_wan = rp // 10000 if rp > 1000 else rp
            except Exception:
                rent_wan = 0
            return {
                "building_addr": building_addr,
                "room_type":     row.get("room_type") or "one_room",
                "rent_type":     row.get("rent_type") or "monthly_rent",
                "room_size":     float(row.get("room_size") or 0) or None,
                "rent_wan":      rent_wan,
                "room_id":       row.get("room_id"),
            }
        except Exception as e:
            logger.debug("[AdminOrchestrator] _extract_room_from_context parse err: %s", e)
    return None


def _format_admin_stats_answer(args: dict, stats_data: dict) -> str | None:
    """
    admin_stats tool result를 사람이 읽기 좋은 텍스트로 변환.
    LLM 재호출 없이 직접 포맷.

    SQL 컬럼 매핑:
      all  쿼리: user_nm, building_nm, room_no, unpaid_months, total_unpaid
      month/today/week 쿼리: user_nm, building_nm, room_no, billing_dt, charge_type, price
    """
    metric  = args.get("metric", "")
    period  = args.get("period", "all")
    rows    = stats_data.get("data") or []
    success = stats_data.get("success", False)

    if not success:
        err = stats_data.get("error", "조회 실패")
        return f"조회 중 오류가 발생했습니다: {err}"

    period_label = {"today": "오늘", "week": "이번 주", "month": "이번 달", "all": "전체"}.get(period, period)

    # ── 미납 현황 ─────────────────────────────────────────────────────────────
    if metric == "unpaid_charges":
        if not rows:
            return f"✅ {period_label} 미납자가 없습니다. 모든 납부가 정상 처리됐습니다."

        def _amount(r):
            """all→total_unpaid(합산) / month·today·week→price(건별)"""
            for k in ("total_unpaid", "price", "amount", "charge_amount"):
                v = r.get(k)
                if v is not None:
                    try: return int(float(str(v).replace(",","")))
                    except: pass
            return 0

        def _months(r):
            """all→unpaid_months(콤마구분) / 건별→billing_dt+charge_type"""
            months = r.get("unpaid_months") or ""
            if months: return months
            dt = r.get("billing_dt") or ""
            ct = r.get("charge_type") or ""
            return f"{dt}({ct})" if dt else ""

        total_amount = sum(_amount(r) for r in rows)
        lines = [f"⚠️ **{period_label} 미납 현황** — 총 {len(rows)}명 / 합계 {total_amount:,}원\n"]
        for r in rows:
            name     = r.get("user_nm") or "알 수 없음"
            building = r.get("building_nm") or ""
            room     = r.get("room_no") or ""
            months   = _months(r)
            amount   = _amount(r)
            lines.append(f"• **{name}** | {building} {room}호 | {months} | **{amount:,}원**")
        return "\n".join(lines) + '\n__BUTTONS__[{"label":"월세 청구 관리","url":"/admin/pay/billings","icon":"💰"}]'

    # ── 점유율 ────────────────────────────────────────────────────────────────
    if metric == "occupancy":
        if not rows:
            return "점유율 데이터를 조회할 수 없습니다."
        lines = [f"🏠 **{period_label} 점유율 현황**\n"]
        for r in rows:
            building = r.get("building_nm") or r.get("building_name") or "전체"
            occ      = r.get("occupancy_rate") or r.get("rate") or 0
            total    = r.get("total_rooms") or r.get("total") or 0
            occupied = r.get("occupied_rooms") or r.get("occupied") or 0
            lines.append(f"• {building}: {occ}% ({occupied}/{total}실)")
        return "\n".join(lines)

    # ── 예약 현황 ─────────────────────────────────────────────────────────────
    if metric == "reservations":
        count = (rows[0].get("count") or rows[0].get("reservation_count") or len(rows)) if rows else 0
        return f"📅 **{period_label} 예약 현황**: 총 {count}건"

    # ── 민원 현황 ─────────────────────────────────────────────────────────────
    if metric == "complaints":
        if not rows:
            return f"📋 {period_label} 접수된 민원이 없습니다."
        lines = [f"📋 **{period_label} 민원 현황** — 총 {len(rows)}건\n"]
        for r in rows:
            status = r.get("complain_st") or r.get("status") or ""
            count  = r.get("count") or r.get("cnt") or 1
            lines.append(f"• {status}: {count}건")
        return "\n".join(lines)

    # ── 계약 현황 ─────────────────────────────────────────────────────────────
    if metric in ("contracts", "contract"):
        count = (rows[0].get("count") or len(rows)) if rows else 0
        return f"📄 **{period_label} 계약 현황**: 총 {count}건"

    # ── 결제 현황 ─────────────────────────────────────────────────────────────
    if metric in ("payments", "payment"):
        if not rows:
            return f"💳 {period_label} 결제 내역이 없습니다."
        def _pay(r):
            for k in ("amount","pay_amount","price"):
                v = r.get(k)
                if v is not None:
                    try: return int(float(str(v).replace(",","")))
                    except: pass
            return 0
        total = sum(_pay(r) for r in rows)
        return f"💳 **{period_label} 결제 현황**: {len(rows)}건 / 합계 {total:,}원"

    # ── 기타 ──────────────────────────────────────────────────────────────────
    if rows:
        return f"**{period_label} {metric} 조회 결과**: {len(rows)}건\n" + "\n".join(
            " | ".join(f"{k}: {v}" for k, v in r.items() if v is not None)
            for r in rows[:10]
        )
    return None