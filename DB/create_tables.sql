/* =========================================================
 * Uni-Place : PURE TABLE/COLUMN CREATE SCRIPT
 * - 제약조건( PRIMARY/FOREIGN/UNIQUE/KEY/CHECK ) 제거
 * - DROP / FK CHECK 토글 제거
 *
 * ⚠️ 주의:
 * 1) 일부 테이블은 AUTO_INCREMENT 컬럼이 있지만 PK/INDEX가 없으면 MySQL에서 에러가 날 수 있습니다.
 * 2) 아래는 “컬럼 정의만” 남긴 추출본(요청사항 그대로)입니다.
 * ========================================================= */

-- ===============================
-- 1) COMMON CODES
-- ===============================
CREATE TABLE group_common_code (
  group_code      VARCHAR(20),
  group_code_name VARCHAR(100) NOT NULL,
  description     VARCHAR(100),
  is_active       INT          NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NULL
);

CREATE TABLE common_code (
  group_code    VARCHAR(20)  NOT NULL,
  code          VARCHAR(20)  NOT NULL,
  code_value    VARCHAR(100) NOT NULL,
  description   VARCHAR(100),
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NULL
);

-- ===============================
-- 2) CORE USER TABLES
-- ===============================
CREATE TABLE users (
  user_id       VARCHAR(50),
  user_nm       VARCHAR(50)  NOT NULL,
  user_email    VARCHAR(100) NOT NULL,
  user_pwd      VARCHAR(255) NOT NULL,
  user_birth    DATE         NOT NULL,
  user_tel      VARCHAR(20)  NOT NULL,
  user_role     ENUM('admin','user','tenant') NOT NULL DEFAULT 'user',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NULL,
  last_login_at DATETIME,
  first_sign    VARCHAR(1)   NOT NULL DEFAULT 'Y',
  user_st       ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  delete_yn     VARCHAR(1)   NOT NULL DEFAULT 'N'
);

CREATE TABLE refresh_tokens (
  refresh_token_id VARCHAR(36),
  user_id          VARCHAR(50)  NOT NULL,
  token_hash       VARCHAR(64)  NOT NULL,
  device_id        VARCHAR(100) NOT NULL,
  user_agent       VARCHAR(300),
  ip               VARCHAR(45),
  issued_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       DATETIME     NOT NULL,
  revoked          TINYINT(1)   NOT NULL DEFAULT 0,
  revoked_at       DATETIME,
  last_used_at     DATETIME,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE social_accounts (
  social_account_id INT          AUTO_INCREMENT,
  user_id           VARCHAR(50)  NOT NULL,
  provider          VARCHAR(20)  NOT NULL,
  provider_user_id  VARCHAR(50)  NOT NULL,
  provider_email    VARCHAR(255),
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

-- ===============================
-- 3) PROPERTY TABLES
-- ===============================
CREATE TABLE building (
  building_id      INT          AUTO_INCREMENT,
  building_nm      VARCHAR(50)  NOT NULL,
  building_addr    VARCHAR(500) NOT NULL,
  building_desc    VARCHAR(500),
  land_category    VARCHAR(20),
  build_size       DECIMAL(5,2),
  building_usage   VARCHAR(20),
  exist_elv        VARCHAR(1),
  parking_capacity INT,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  delete_yn        VARCHAR(1)   NOT NULL DEFAULT 'N'
);

CREATE TABLE rooms (
  room_id       INT           AUTO_INCREMENT,
  room_no       INT           NOT NULL,
  floor         INT           NOT NULL,
  room_size     DECIMAL(5,2)  NOT NULL,
  building_id   INT           NOT NULL,
  deposit       DECIMAL(12,0),
  rent_price    DECIMAL(12,0) NOT NULL,
  manage_fee    DECIMAL(12,0),
  rent_type     ENUM('monthly_rent','stay')                                   NOT NULL DEFAULT 'monthly_rent',
  room_st       ENUM('available','reserved','contracted','repair','cleaning') NOT NULL DEFAULT 'available',
  room_options  VARCHAR(500),
  room_capacity INT           NOT NULL DEFAULT 1,
  rent_min      INT,
  sun_direction ENUM('n','s','w','e'),
  room_desc     VARCHAR(3000),
  delete_yn     VARCHAR(1)    NOT NULL DEFAULT 'N'
);

CREATE TABLE common_space (
  space_id       INT          AUTO_INCREMENT,
  space_nm       VARCHAR(50)  NOT NULL,
  building_id    INT          NOT NULL,
  space_capacity INT,
  space_floor    INT          NOT NULL,
  space_options  VARCHAR(500),
  space_desc     VARCHAR(3000)
);

-- ===============================
-- 4) FILES / COMPANY / BANNER
-- ===============================
CREATE TABLE files (
  file_id          INT           AUTO_INCREMENT,
  file_parent_type VARCHAR(50)   NOT NULL,
  file_parent_id   INT,
  file_path        VARCHAR(1000) NOT NULL,
  origin_filename  VARCHAR(260)  NOT NULL,
  rename_filename  VARCHAR(260)  NOT NULL,
  file_size        INT           NOT NULL,
  file_type        VARCHAR(20)   NOT NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  delete_yn        VARCHAR(1)    NOT NULL DEFAULT 'N'
);

CREATE TABLE company_info (
  company_id    INT          AUTO_INCREMENT,
  company_nm    VARCHAR(100) NOT NULL,
  company_ceo   VARCHAR(50),
  business_no   VARCHAR(50),
  company_tel   VARCHAR(30),
  company_email VARCHAR(100),
  company_addr  VARCHAR(500),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE banner (
  ban_id     INT          AUTO_INCREMENT,
  start_at   DATETIME     NOT NULL,
  end_at     DATETIME     NOT NULL,
  ban_title  VARCHAR(100) NOT NULL,
  ban_url    VARCHAR(200),
  ban_order  INT          NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ban_st     ENUM('active','inactive') NOT NULL DEFAULT 'active'
);

-- ===============================
-- 5) AFFILIATE & PRODUCT
-- ===============================
CREATE TABLE affiliate (
  affiliate_id       INT          AUTO_INCREMENT,
  building_id        INT          NOT NULL,
  affiliate_nm       VARCHAR(50)  NOT NULL,
  affiliate_ceo      VARCHAR(50),
  affiliate_tel      VARCHAR(30),
  business_no        VARCHAR(50),
  affiliate_fax      VARCHAR(30),
  affiliate_email    VARCHAR(100),
  affiliate_addr     VARCHAR(500),
  affiliate_start_at DATETIME,
  affiliate_end_at   DATETIME,
  code               VARCHAR(20),
  affiliate_desc     VARCHAR(3000),
  affiliate_st       ENUM('planned','progress','ended')
);

CREATE TABLE product (
  prod_id      INT           AUTO_INCREMENT,
  prod_nm      VARCHAR(50)   NOT NULL,
  prod_price   DECIMAL(12,0) NOT NULL,
  prod_stock   INT           NOT NULL,
  code         VARCHAR(20)   NOT NULL,
  prod_desc    VARCHAR(2000) NOT NULL,
  prod_st      ENUM('on_sale','sold_out') NOT NULL DEFAULT 'on_sale',
  affiliate_id INT
);

-- ===============================
-- 6) CONTRACT & RESIDENTS
-- ===============================
CREATE TABLE contract (
  contract_id          INT           AUTO_INCREMENT,
  user_id              VARCHAR(50)   NOT NULL,
  room_id              INT           NOT NULL,
  contract_start       DATE          NOT NULL,
  contract_end         DATE          NOT NULL,
  deposit              DECIMAL(12,0),
  rent_price           DECIMAL(12,0) NOT NULL,
  manage_fee           DECIMAL(12,0),
  payment_day          INT           NOT NULL,
  contract_st          ENUM('requested','active','ended','cancelled') NOT NULL DEFAULT 'requested',
  sign_at              DATETIME,
  movein_at            DATETIME,
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  rent_type            ENUM('monthly_rent','stay') NOT NULL DEFAULT 'monthly_rent',
  lessor_nm            VARCHAR(50)   NOT NULL,
  lessor_tel           VARCHAR(20)   NOT NULL,
  lessor_addr          VARCHAR(100)  NOT NULL,
  lessor_rrn           VARCHAR(20)   NOT NULL,
  lessor_sign_file_id  INT,
  contract_pdf_file_id INT
);

CREATE TABLE residents (
  resident_id INT         AUTO_INCREMENT,
  building_id INT         NOT NULL,
  contract_id INT         NOT NULL,
  user_id     VARCHAR(50) NOT NULL
);

-- ===============================
-- 7) RESERVATIONS
-- ===============================
CREATE TABLE room_reservation (
  tour_id       INT         AUTO_INCREMENT,
  building_id   INT         NOT NULL,
  room_id       INT         NOT NULL,
  tour_start_at DATETIME    NOT NULL,
  tour_end_at   DATETIME    NOT NULL,
  tour_nm       VARCHAR(50) NOT NULL,
  tour_tel      VARCHAR(20) NOT NULL,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tour_st       ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',
  tour_pwd      VARCHAR(4)
);

CREATE TABLE space_reservations (
  reservation_id INT         AUTO_INCREMENT,
  building_id    INT         NOT NULL,
  space_id       INT         NOT NULL,
  user_id        VARCHAR(50) NOT NULL,
  sr_start_at    DATETIME    NOT NULL,
  sr_end_at      DATETIME    NOT NULL,
  sr_no_people   INT         NOT NULL,
  sr_st          ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested'
);

-- ===============================
-- 8) COMMUNITY
-- ===============================
CREATE TABLE board (
  board_id    INT          AUTO_INCREMENT,
  board_title VARCHAR(300) NOT NULL,
  user_id     VARCHAR(50)  NOT NULL,
  board_ctnt  VARCHAR(3000),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  read_count  INT          NOT NULL DEFAULT 0,
  code        VARCHAR(20)  NOT NULL,
  anonymity   VARCHAR(1)   NOT NULL DEFAULT 'N',
  importance  VARCHAR(1)   NOT NULL DEFAULT 'N',
  imp_end_at  DATETIME,
  file_ck     VARCHAR(1)   NOT NULL DEFAULT 'N',
  reply_ck    VARCHAR(1)   NOT NULL DEFAULT 'N'
);

CREATE TABLE reply (
  reply_id   INT           AUTO_INCREMENT,
  board_id   INT           NOT NULL,
  user_id    VARCHAR(50)   NOT NULL,
  reply_ctnt VARCHAR(2000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_id  INT,
  reply_lev  INT           NOT NULL DEFAULT 1,
  reply_seq  INT           NOT NULL DEFAULT 1
);

CREATE TABLE board_likes (
  user_id  VARCHAR(50) NOT NULL,
  board_id INT         NOT NULL
);

CREATE TABLE reply_likes (
  user_id  VARCHAR(50) NOT NULL,
  reply_id INT         NOT NULL
);

-- ===============================
-- 9) SUPPORT (NOTICE / FAQ / QNA / COMPLAIN)
-- ===============================
CREATE TABLE notice (
  notice_id    INT          AUTO_INCREMENT,
  notice_title VARCHAR(100) NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id      VARCHAR(50)  NOT NULL,
  notice_ctnt  VARCHAR(3000),
  importance   VARCHAR(1)   NOT NULL DEFAULT 'N',
  imp_end_at   DATETIME,
  read_count   INT          NOT NULL DEFAULT 0,
  notice_st    ENUM('notice','event','FAQ','policy','partnership','recruit','operation') NOT NULL DEFAULT 'notice',
  file_ck      VARCHAR(1)   NOT NULL DEFAULT 'N',
  code         VARCHAR(20)  NOT NULL
);

CREATE TABLE faq (
  faq_id     INT           AUTO_INCREMENT,
  faq_title  VARCHAR(100)  NOT NULL,
  faq_ctnt   VARCHAR(3000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active  INT           NOT NULL DEFAULT 1,
  code       VARCHAR(20)   NOT NULL
);

CREATE TABLE qna (
  qna_id     INT           AUTO_INCREMENT,
  parent_id  INT,
  qna_title  VARCHAR(255)  NOT NULL,
  user_id    VARCHAR(50)   NOT NULL,
  qna_st     ENUM('waiting','complete') NOT NULL DEFAULT 'waiting',
  read_count INT           NOT NULL DEFAULT 0,
  qna_ctnt   VARCHAR(4000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code       VARCHAR(20)   NOT NULL,
  file_ck    VARCHAR(1)    NOT NULL DEFAULT 'N',
  reply_ck   VARCHAR(1)    NOT NULL DEFAULT 'N',
  group_id   INT,
  qna_lev    INT           NOT NULL DEFAULT 0
);

CREATE TABLE complain (
  comp_id    INT           AUTO_INCREMENT,
  comp_title VARCHAR(300)  NOT NULL,
  user_id    VARCHAR(50)   NOT NULL,
  comp_ctnt  VARCHAR(3000),
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  comp_st    ENUM('in_progress','resolved') NOT NULL DEFAULT 'in_progress',
  code       VARCHAR(20)   NOT NULL,
  file_ck    VARCHAR(1)    NOT NULL DEFAULT 'N',
  reply_ck   VARCHAR(1)    NOT NULL DEFAULT 'N'
);

-- ===============================
-- 10) REVIEWS
-- ===============================
CREATE TABLE reviews (
  review_id    INT          AUTO_INCREMENT,
  user_id      VARCHAR(50)  NOT NULL,
  room_id      INT          NOT NULL,
  rating       INT          NOT NULL,
  review_title VARCHAR(100),
  review_ctnt  VARCHAR(3000),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code         VARCHAR(20)  NOT NULL,
  file_ck      VARCHAR(1)   NOT NULL DEFAULT 'N',
  reply_ck     VARCHAR(1)   NOT NULL DEFAULT 'N'
);

-- ===============================
-- 11) NOTIFICATION
-- ===============================
CREATE TABLE notification (
  notification_id INT         AUTO_INCREMENT,
  receiver_id     VARCHAR(50) NOT NULL,
  code            VARCHAR(20) NOT NULL,
  sender_id       VARCHAR(50),
  message         VARCHAR(255),
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read         VARCHAR(1)  NOT NULL DEFAULT 'N',
  is_read_at      DATETIME,
  target_id       INT,
  target          ENUM('board','reply','notice'),
  url_path        VARCHAR(260)
);

-- ===============================
-- 12) CART
-- ===============================
CREATE TABLE cart (
  cart_id         INT         AUTO_INCREMENT,
  user_id         VARCHAR(50) NOT NULL,
  cart_created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  cart_item_id   INT           AUTO_INCREMENT,
  cart_id        INT           NOT NULL,
  prod_id        INT           NOT NULL,
  order_quantity INT           NOT NULL,
  order_price    DECIMAL(10,0) NOT NULL
);

-- ===============================
-- 13) PAYMENT LOOKUP TABLES
-- ===============================
CREATE TABLE payment_method (
  payment_method_id INT         AUTO_INCREMENT,
  payment_method_nm VARCHAR(50) NOT NULL,
  payment_method_cd VARCHAR(20) NOT NULL,
  is_active         INT         NOT NULL DEFAULT 1
);

CREATE TABLE service_goods (
  service_goods_id INT         AUTO_INCREMENT,
  service_goods_cd VARCHAR(50) NOT NULL,
  service_goods_nm VARCHAR(50) NOT NULL,
  is_active        INT         NOT NULL DEFAULT 1,
  display_order    INT
);

CREATE TABLE payment_status (
  status_cd     VARCHAR(20),
  `description` VARCHAR(255),
  is_terminal   INT          NOT NULL DEFAULT 1,
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1
);

CREATE TABLE charge_status (
  status_cd     VARCHAR(20),
  `description` VARCHAR(255),
  is_terminal   INT          NOT NULL DEFAULT 1,
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1
);

-- ===============================
-- 14) PAYMENT & ORDERS
-- ===============================
CREATE TABLE payment (
  payment_id          INT           AUTO_INCREMENT,
  user_id             VARCHAR(50)   NOT NULL,
  service_goods_id    INT           NOT NULL,
  target_type         VARCHAR(20)   NOT NULL,
  target_id           INT           NOT NULL,
  currency            CHAR(3)       NOT NULL DEFAULT 'KRW',
  total_price         DECIMAL(12,0) NOT NULL,
  captured_price      DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_method_id   INT,
  provider            VARCHAR(20)   NOT NULL,
  provider_payment_id VARCHAR(100),
  merchant_uid        VARCHAR(100)  NOT NULL,
  idempotency_key     VARCHAR(100)  NULL,
  tax_scope_price     DECIMAL(12,0),
  tax_ex_scope_price  DECIMAL(12,0),
  tax_free_price      DECIMAL(12,0),
  payment_st          VARCHAR(20)   NOT NULL DEFAULT 'ready',
  paid_at             DATETIME
);

CREATE TABLE orders (
  order_id         INT           AUTO_INCREMENT,
  user_id          VARCHAR(50)   NOT NULL,
  order_st         ENUM('ordered','paid','ended','cancelled') NOT NULL DEFAULT 'ordered',
  total_price      DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_id       INT,
  order_created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  order_item_id  INT           AUTO_INCREMENT,
  order_id       INT           NOT NULL,
  prod_id        INT           NOT NULL,
  order_quantity INT           NOT NULL,
  order_price    DECIMAL(12,0) NOT NULL
);

CREATE TABLE room_service_order (
  order_id          INT           AUTO_INCREMENT,
  parent_order_id   INT           NOT NULL,
  user_id           VARCHAR(50)   NOT NULL,
  room_id           INT           NOT NULL,
  total_price       DECIMAL(12,0) NOT NULL,
  order_st          ENUM('requested','paid','delivered','cancelled') NOT NULL DEFAULT 'requested',
  room_service_desc VARCHAR(200),
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE monthly_charge (
  charge_id   INT           AUTO_INCREMENT,
  contract_id INT           NOT NULL,
  charge_type VARCHAR(30)   NOT NULL,
  billing_dt  CHAR(7)       NOT NULL,
  price       DECIMAL(12,0) NOT NULL,
  charge_st   VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
  payment_id  INT,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_attempt (
  attempt_id  INT      AUTO_INCREMENT,
  payment_id  INT      NOT NULL,
  attempt_st  ENUM('requested','approved','failed') NOT NULL DEFAULT 'failed',
  finished_at DATETIME
);

CREATE TABLE payment_refund (
  refund_id     INT           AUTO_INCREMENT,
  payment_id    INT           NOT NULL,
  refund_price  DECIMAL(12,0),
  refund_st     ENUM('requested','done','failed'),
  refund_reason VARCHAR(255),
  completed_at  DATETIME
);

CREATE TABLE payment_intent (
  payment_intent_id    BIGINT        AUTO_INCREMENT,
  payment_id           INT           NOT NULL,
  provider             VARCHAR(20)   NOT NULL,
  intent_st            ENUM('CREATED','READY_OK','READY_FAIL','RETURNED','APPROVE_OK','APPROVE_FAIL','CANCELED') NOT NULL DEFAULT 'CREATED',
  provider_ref_id      VARCHAR(100),
  app_scheme_url       VARCHAR(2000),
  return_url           VARCHAR(1000),
  returned_params_json JSON,
  pg_ready_json        JSON,
  pg_approve_json      JSON,
  fail_code            VARCHAR(20),
  fail_message         VARCHAR(255),
  created_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);