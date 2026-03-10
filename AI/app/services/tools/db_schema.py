# app/services/tools/db_schema.py
"""
LLM에게 전달할 DB 스키마 정의.

Text-to-SQL에서 LLM이 올바른 SQL을 생성하려면
정확한 테이블명, 컬럼명, 관계, enum 값을 알아야 합니다.
"""

DB_SCHEMA = """
[UNI PLACE 데이터베이스 스키마]

== 공개 조회 가능 테이블 ==

▶ building (빌딩)
  - building_id       INT PK
  - building_nm       VARCHAR(50)   빌딩명
  - building_addr     VARCHAR(500)  주소
  - building_desc     VARCHAR(500)  설명
  - build_size        DECIMAL(5,2)  규모(㎡)
  - building_usage    VARCHAR(20)   용도
  - exist_elv         CHAR(1)       엘리베이터 여부 ('Y'/'N')
  - parking_capacity  INT           주차 가능 대수

▶ room (방)
  - room_id           INT PK
  - room_no           INT           호수
  - building_id       INT FK → building.building_id
  - floor             INT           층
  - room_size         DECIMAL(5,2)  면적(㎡)
  - room_type         ENUM          one_room / two_room / three_room / loft / share
  - pet_allowed_yn    ENUM          Y / N
  - deposit           DECIMAL(12,0) 보증금(원)
  - rent_price        DECIMAL(12,0) 월세(원)
  - manage_fee        DECIMAL(12,0) 관리비(원)
  - rent_type         ENUM          monthly_rent / stay
  - room_st           ENUM          available / reserved / contracted / repair / cleaning
  - room_capacity     INT           수용 인원
  - room_options      VARCHAR(500)  옵션 설명

▶ review (리뷰)
  - review_id         INT PK
  - user_id           VARCHAR(50)   작성자
  - room_id           INT FK → room.room_id
  - rating            INT           별점 (1~5)
  - review_title      VARCHAR(100)  제목
  - review_ctnt       VARCHAR(3000) 내용
  - read_count        INT           조회수
  - like_count        INT           좋아요 수
  - created_at        DATETIME

▶ common_space (공용 시설)
  - space_id          INT PK
  - space_nm          VARCHAR(50)   시설명 (헬스장, 회의실 등)
  - building_id       INT FK → building.building_id
  - space_capacity    INT           수용 인원
  - space_floor       INT           층
  - space_options     VARCHAR(500)  옵션
  - space_desc        VARCHAR(3000) 설명

▶ tour_reservation (투어 예약)
  - tour_id           INT PK
  - building_id       INT FK → building.building_id
  - room_id           INT FK → room.room_id
  - tour_start_at     DATETIME      투어 시작
  - tour_end_at       DATETIME      투어 종료
  - tour_nm           VARCHAR(50)   예약자명
  - tour_tel          VARCHAR(20)   전화번호
  - tour_st           ENUM          pending / confirmed / cancelled / completed / ended / no_show
  - created_at        DATETIME

▶ board (커뮤니티 게시글)
  - board_id          INT PK
  - board_title       VARCHAR(300)  제목
  - user_id           VARCHAR(50)
  - board_ctnt        LONGTEXT      내용
  - read_count        INT
  - code              VARCHAR(20)   카테고리 코드
  - created_at        DATETIME
  - anonymity         CHAR(1)       익명 여부 ('Y'/'N')

▶ notice (공지사항)
  - notice_id         INT PK
  - notice_title      VARCHAR(100)  제목
  - notice_ctnt       VARCHAR(3000) 내용
  - notice_st         ENUM          active / inactive
  - read_count        INT
  - created_at        DATETIME

▶ faq (자주 묻는 질문)
  - faq_id            INT PK
  - faq_title         VARCHAR(100)  질문
  - faq_ctnt          VARCHAR(3000) 답변
  - is_active         INT           1=활성, 0=비활성
  - created_at        DATETIME

▶ company_info (회사 정보)
  - company_info_id   INT PK
  - company_nm        VARCHAR(100)  회사명
  - company_ceo       VARCHAR(50)   대표자
  - company_tel       VARCHAR(20)   전화번호
  - company_email     VARCHAR(100)  이메일
  - company_addr      VARCHAR(200)  주소

== 로그인 필요 테이블 ==

▶ contract (계약) — user_id 필터 필수
  - contract_id       INT PK
  - user_id           VARCHAR(50) FK → user
  - room_id           INT FK → room.room_id
  - contract_start    DATE          계약 시작일
  - contract_end      DATE          계약 종료일
  - deposit           DECIMAL(12,0) 보증금
  - rent_price        DECIMAL(12,0) 월세
  - manage_fee        DECIMAL(12,0) 관리비
  - payment_day       INT           납부일
  - contract_st       ENUM          requested / approved / active / ended / cancelled

▶ space_reservation (공용 시설 예약) — user_id 필터 필수
  - reservation_id    INT PK
  - user_id           VARCHAR(50) FK
  - building_id       INT FK → building.building_id
  - space_id          INT FK → common_space.space_id
  - sr_start_at       DATETIME
  - sr_end_at         DATETIME
  - sr_no_people      INT
  - sr_st             ENUM          requested / confirmed / cancelled

▶ complain (민원) — user_id 필터 필수
  - comp_id           INT PK
  - user_id           VARCHAR(50)
  - comp_title        VARCHAR(300)  제목
  - comp_ctnt         VARCHAR(3000) 내용
  - comp_st           ENUM          pending / received / in_progress / resolved / closed
  - importance        ENUM          high / medium / low
  - ai_reason         VARCHAR(500)  AI 분석 결과
  - reply_ck          CHAR(1)       답변 여부
  - created_at        DATETIME

▶ payment (결제) — user_id 필터 필수
  - payment_id        INT PK
  - user_id           VARCHAR(50)
  - total_price       DECIMAL(12,0) 결제 금액
  - captured_price    DECIMAL(12,0) 실 결제 금액
  - payment_st        VARCHAR(20)   ready / paid / cancelled / pending / disputed
  - provider          VARCHAR(20)   결제 수단
  - paid_at           DATETIME
  - created_at        DATETIME

▶ product_building_stock (룸서비스 재고)
  - stock_id          INT PK
  - building_id       INT FK → building.building_id
  - prod_nm           VARCHAR(100)  상품명
  - prod_stock        INT           재고 수량
  - updated_at        DATETIME

[JOIN 예시]
- 빌딩별 방 목록: SELECT r.* FROM room r JOIN building b ON r.building_id = b.building_id WHERE b.building_nm LIKE '%유니플레이스B%'
- 방 개수: SELECT COUNT(*) FROM room r JOIN building b ON r.building_id = b.building_id WHERE b.building_nm LIKE '%이름%'
- 리뷰 + 빌딩: SELECT rv.*, b.building_nm FROM review rv JOIN room r ON rv.room_id = r.room_id JOIN building b ON r.building_id = b.building_id

[중요 규칙]
- 빌딩명 검색은 반드시 LIKE '%이름%' 사용 (정확한 이름을 모를 수 있음)
- 로그인 필요 테이블(contract, space_reservation, complain, payment)은 반드시 WHERE user_id = '{user_id}' 포함
- SELECT만 허용, INSERT/UPDATE/DELETE/DROP 절대 금지
- 결과는 최대 50건 제한 (LIMIT 50)
"""

# SQL 실행 허용 테이블 화이트리스트
ALLOWED_TABLES = {
    # 공개
    "building", "room", "review", "common_space",
    "tour_reservation", "board", "notice", "faq", "company_info",
    # 로그인 필요
    "contract", "space_reservation", "complain", "payment",
    "product_building_stock",
}

# 로그인이 필요한 테이블 (user_id 강제 주입)
AUTH_REQUIRED_TABLES = {
    "contract", "space_reservation", "complain", "payment",
}

# 절대 허용 안 되는 SQL 키워드
FORBIDDEN_SQL_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
    "CREATE", "GRANT", "REVOKE", "EXEC", "EXECUTE", "CALL",
    "INTO", "SET ", "MERGE",
}
