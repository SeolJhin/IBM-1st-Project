# app/services/tools/tool_definitions.py
"""
AI Tool 목록 정의 — 하이브리드 구조.

[구분]
1. query_database  : 모든 단순/집계/복합 조회 → LLM이 SQL 직접 생성
2. 전용 tool       : 비즈니스 로직이 필요하거나 민감한 기능 (투어 슬롯 계산, 민원 분류 등)

[장점]
- 새 빌딩/테이블/컬럼 추가 → DB만 수정하면 AI가 자동 인식
- 복잡한 JOIN, 집계(COUNT, AVG 등)도 자연어로 처리 가능
- 비즈니스 로직(인증, 실시간 투어 충돌 체크 등)은 전용 tool로 안전하게 처리
"""

TOOL_DEFINITIONS = [

    # ══════════════════════════════════════════════════════════════════
    # 핵심: query_database — 모든 조회 질문의 기본 도구
    # ══════════════════════════════════════════════════════════════════
    {
        "name": "query_database",
        "description": (
            "DB에 SQL 쿼리를 실행하여 데이터를 조회합니다. 로그인 불필요한 공개 데이터에 사용합니다. "
            "빌딩 목록/개수, 방 검색/개수, 리뷰 조회, 공용 시설, 공지사항, FAQ, 회사 정보 등 "
            "모든 단순 조회와 집계(COUNT, AVG, SUM)에 사용하세요. "
            "빌딩명 검색은 LIKE '%이름%'을 사용하세요. "
            "결과는 최대 50건으로 제한됩니다."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": (
                        "실행할 SELECT SQL 쿼리. "
                        "예) SELECT COUNT(*) as cnt FROM rooms r "
                        "JOIN building b ON r.building_id = b.building_id "
                        "WHERE b.building_nm LIKE '%유니플레이스B%'"
                    ),
                },
                "description": {
                    "type": "string",
                    "description": "이 쿼리가 무엇을 조회하는지 한 줄 설명 (예: '유니플레이스B 방 개수 조회')",
                },
            },
            "required": ["sql", "description"],
        },
    },

    # ══════════════════════════════════════════════════════════════════
    # 로그인 유저 전용 조회 (user_id 기반 — SQL에 자동 주입)
    # ══════════════════════════════════════════════════════════════════
    {
        "name": "query_my_data",
        "description": (
            "로그인한 사용자의 개인 데이터를 조회합니다. (로그인 필요) "
            "내 계약, 내 공용 시설 예약, 내 민원, 내 결제 내역 조회에 사용합니다. "
            "SQL에 {user_id} 플레이스홀더를 사용하면 자동으로 실제 user_id로 치환됩니다. "
            "예) SELECT * FROM contract WHERE user_id = '{user_id}'"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": (
                        "실행할 SELECT SQL. user_id 조건에 반드시 {user_id} 플레이스홀더 사용. "
                        "예) SELECT c.*, r.room_no, b.building_nm "
                        "FROM contract c "
                        "JOIN rooms r ON c.room_id = r.room_id "
                        "JOIN building b ON r.building_id = b.building_id "
                        "WHERE c.user_id = '{user_id}' AND c.contract_st = 'active'"
                    ),
                },
                "description": {
                    "type": "string",
                    "description": "이 쿼리가 무엇을 조회하는지 한 줄 설명",
                },
            },
            "required": ["sql", "description"],
        },
    },

    # ══════════════════════════════════════════════════════════════════
    # 비즈니스 로직 전용 tool (SQL로 대체 불가한 것들)
    # ══════════════════════════════════════════════════════════════════
    {
        "name": "get_tour_available_slots",
        "description": (
            "투어 예약 가능한 시간대를 조회합니다. "
            "향후 7일간의 예약 가능 시간대를 반환하며, "
            "room_id를 지정하면 실제 예약 충돌 여부를 실시간으로 확인합니다."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "room_id": {
                    "type": "integer",
                    "description": "투어할 방의 ID (선택 — 없으면 모든 시간대 가능으로 반환)",
                },
            },
            "required": [],
        },
    },

    {
        "name": "classify_complain_priority",
        "description": (
            "민원 내용을 AI로 분석하여 처리 우선순위(high/medium/low)를 분류합니다. "
            "사용자가 민원을 접수하거나 우선순위 판단이 필요할 때 사용합니다."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "complain_text": {
                    "type": "string",
                    "description": "분석할 민원 내용 텍스트",
                },
            },
            "required": ["complain_text"],
        },
    },
]

# tool name → definition 빠른 조회용
TOOL_MAP = {t["name"]: t for t in TOOL_DEFINITIONS}

# 로그인이 필요한 tool
AUTH_REQUIRED_TOOLS = {"query_my_data"}