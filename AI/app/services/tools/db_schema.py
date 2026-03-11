# app/services/tools/db_schema.py
"""
LLM에게 전달할 DB 스키마 정의.

Text-to-SQL에서 LLM이 올바른 SQL을 생성하려면
정확한 테이블명, 컬럼명, 관계, enum 값을 알아야 합니다.
"""

DB_SCHEMA = """
[UNI PLACE DB 스키마]
⚠️ 테이블명 정확히 사용. building(단수)·rooms(복수) 혼용 주의.

== 공개 테이블 ==
▶ building: building_id(PK) building_nm building_addr build_size exist_elv(Y/N) parking_capacity delete_yn
▶ rooms: room_id(PK) room_no building_id(FK) floor room_size room_type(one_room/two_room/three_room/loft/share) pet_allowed_yn(Y/N) deposit rent_price manage_fee rent_type(monthly_rent/stay) room_st(available/reserved/contracted/repair/cleaning) room_capacity room_options delete_yn
  room_options: 영문 저장(aircon,desk,refrigerator,washer,bed,wardrobe,microwave,TV)
  ⚠️ LIKE 검색: (r.room_options LIKE '%에어컨%' OR r.room_options LIKE '%aircon%') 형태
▶ reviews: review_id(PK) user_id room_id(FK) rating(1~5) review_title review_ctnt read_count like_count created_at
▶ common_space: space_id(PK) space_nm building_id(FK) space_capacity space_floor space_options space_desc
▶ room_reservation: tour_id(PK) building_id(FK) room_id(FK) tour_start_at tour_end_at tour_nm tour_tel tour_st(pending/confirmed/cancelled/completed/ended/no_show) created_at
  ⚠️ user_id 컬럼 없음 → query_my_data 사용 불가
▶ board: board_id(PK) board_title user_id board_ctnt read_count code created_at anonymity(Y/N)
▶ notice: notice_id(PK) notice_title notice_ctnt notice_st(active/inactive) read_count created_at
▶ faq: faq_id(PK) faq_title faq_ctnt is_active(1/0) created_at
▶ company_info: company_info_id(PK) company_nm company_ceo company_tel company_email company_addr
▶ product_building_stock: stock_id(PK) building_id(FK) prod_nm prod_stock updated_at

== 로그인 필요 테이블 (query_my_data + WHERE user_id=\'{{user_id}}\' 필수) ==
▶ contract: contract_id(PK) user_id room_id(FK) contract_start contract_end deposit rent_price manage_fee payment_day contract_st(requested/approved/active/ended/cancelled)
▶ space_reservations: reservation_id(PK) user_id building_id(FK) space_id(FK) sr_start_at sr_end_at sr_no_people sr_st(requested/confirmed/cancelled)
▶ complain: comp_id(PK) user_id comp_title comp_ctnt comp_st(pending/received/in_progress/resolved/closed) importance(high/medium/low) ai_reason reply_ck created_at
▶ payment: payment_id(PK) user_id total_price captured_price payment_st(ready/paid/cancelled/pending/disputed) provider paid_at created_at

[빌딩명] 한글→영문 변환 필수 (DB는 영문 저장)
  유니플레이스/유니플A → Uniplace A | 유니플B → Uniplace B | 유니플C → Uniplace C
  검색: WHERE b.building_nm LIKE '%Uniplace A%'

[핵심 규칙]
- building/rooms: WHERE delete_yn=\'N\' 필수
- 방 조회: SELECT r.room_id, r.room_no, r.floor, r.deposit, r.rent_price, r.manage_fee, r.room_options, b.building_nm FROM rooms r JOIN building b ON r.building_id=b.building_id WHERE r.delete_yn=\'N\' AND b.delete_yn=\'N\'
- 로그인 테이블: WHERE user_id=\'{user_id}\' 필수
- SELECT만 허용, LIMIT 50
"""

# SQL 실행 허용 테이블 화이트리스트
ALLOWED_TABLES = {
    # 공개
    "building", "rooms", "reviews", "common_space",
    "room_reservation", "board", "notice", "faq", "company_info",
    # 로그인 필요
    "contract", "space_reservations", "complain", "payment",
    "product_building_stock",
}

# 로그인이 필요한 테이블 (user_id 강제 주입)
AUTH_REQUIRED_TABLES = {
    "contract", "space_reservations", "complain", "payment",
}

# 절대 허용 안 되는 SQL 키워드
FORBIDDEN_SQL_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL",
    "INTO", "SET ", "MERGE",
}