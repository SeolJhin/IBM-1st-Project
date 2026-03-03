/* =========================================================
 * Uni-Place : FULL CREATE SCRIPT (Parent → Child)
 * - FK 충돌 없이 순서 보장
 * - 한번에 복사/실행 가능
 * - MySQL 8.x 기준
 * ========================================================= */


SET FOREIGN_KEY_CHECKS = 0;


-- ===============================
-- 0) Drop All Tables
-- ===============================
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS payment_refund;
DROP TABLE IF EXISTS payment_attempt;
DROP TABLE IF EXISTS payment_intent;


DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS room_service_order;
DROP TABLE IF EXISTS monthly_charge;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payment;


DROP TABLE IF EXISTS payment_method;
DROP TABLE IF EXISTS service_goods;
DROP TABLE IF EXISTS payment_status;
DROP TABLE IF EXISTS charge_status;


DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;


DROP TABLE IF EXISTS reply_likes;
DROP TABLE IF EXISTS board_likes;
DROP TABLE IF EXISTS reply;
DROP TABLE IF EXISTS qna;
DROP TABLE IF EXISTS complain;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS faq;
DROP TABLE IF EXISTS notice;
DROP TABLE IF EXISTS board;


DROP TABLE IF EXISTS space_reservations;
DROP TABLE IF EXISTS room_reservation;


DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS contract;


DROP TABLE IF EXISTS product_building_stock;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS affiliate;


DROP TABLE IF EXISTS common_space;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS building;


DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS banner;
DROP TABLE IF EXISTS company_info;


DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS users;


DROP TABLE IF EXISTS common_code;
DROP TABLE IF EXISTS group_common_code;


-- ===============================
-- 1) COMMON CODES
-- ===============================
CREATE TABLE group_common_code (
  group_code      VARCHAR(20)  PRIMARY KEY,
  group_code_name VARCHAR(100) NOT NULL,
  description     VARCHAR(100),
  is_active       INT          NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NULL,
  UNIQUE KEY uq_group_code_name (group_code_name)
) ENGINE=InnoDB;


CREATE TABLE common_code (
  group_code    VARCHAR(20)  NOT NULL,
  code          VARCHAR(20)  NOT NULL,
  code_value    VARCHAR(100) NOT NULL,
  description   VARCHAR(100),
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NULL,
  PRIMARY KEY (code),
  KEY ix_common_code_group (group_code),
  CONSTRAINT fk_common_code_group
    FOREIGN KEY (group_code) REFERENCES group_common_code(group_code)
) ENGINE=InnoDB;


-- ===============================
-- 2) CORE USER TABLES
-- ===============================
CREATE TABLE users (
  user_id       VARCHAR(50)  PRIMARY KEY,
  user_nm       VARCHAR(50)  NOT NULL,
  user_nickname VARCHAR(50)  NULL,
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
  delete_yn     VARCHAR(1)   NOT NULL DEFAULT 'N',
  UNIQUE KEY uq_users_email (user_email),
  UNIQUE KEY uq_users_nickname (user_nickname),
  KEY ix_users_tel (user_tel)
) ENGINE=InnoDB;




CREATE TABLE refresh_tokens (
  refresh_token_id VARCHAR(36)  PRIMARY KEY,
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
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refresh_token_hash  (token_hash),
  KEY ix_refresh_tokens_user        (user_id),
  KEY ix_refresh_tokens_device      (user_id, device_id),
  KEY ix_refresh_tokens_expires     (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE password_reset_tokens (
    id           VARCHAR(50)  NOT NULL PRIMARY KEY,
    user_id      VARCHAR(50)  NOT NULL,
    token        VARCHAR(100) NOT NULL UNIQUE,
    expires_at   DATETIME     NOT NULL,
    used         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_prt_token   (token),
    INDEX ix_prt_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;




CREATE TABLE social_accounts (
  social_account_id INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           VARCHAR(50)  NOT NULL,
  provider          VARCHAR(20)  NOT NULL,
  provider_user_id  VARCHAR(50)  NOT NULL,
  provider_email    VARCHAR(255),
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  KEY ix_oauth_user (user_id)
) ENGINE=InnoDB;


-- ===============================
-- 3) PROPERTY TABLES
-- ===============================
CREATE TABLE building (
  building_id           INT          AUTO_INCREMENT PRIMARY KEY,
  building_nm           VARCHAR(50)  NOT NULL,
  building_addr         VARCHAR(500) NOT NULL,
  building_desc         VARCHAR(500),
  land_category         VARCHAR(20),
  build_size            DECIMAL(5,2),
  building_usage        VARCHAR(20),
  exist_elv             VARCHAR(1),
  parking_capacity      INT,
  building_lessor_nm    VARCHAR(50)  NULL COMMENT '임대인 성명',
  building_lessor_tel   VARCHAR(20)  NULL COMMENT '임대인 전화번호',
  building_lessor_addr  VARCHAR(200) NULL COMMENT '임대인 주소',
  building_lessor_rrn   VARCHAR(20)  NULL COMMENT '임대인 주민등록번호',
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  delete_yn             VARCHAR(1)   NOT NULL DEFAULT 'N',
  KEY ix_building_delete (delete_yn)
) ENGINE=InnoDB;




--  delete_yn 추가 (soft delete 지원)
CREATE TABLE rooms (
  room_id         INT           AUTO_INCREMENT PRIMARY KEY,
  room_no         INT           NOT NULL,
  floor           INT           NOT NULL,
  room_size       DECIMAL(5,2)  NOT NULL,
  room_type       ENUM('one_room','two_room','three_room','loft','share') NOT NULL DEFAULT 'one_room',
  pet_allowed_yn  ENUM('Y','N') NOT NULL DEFAULT 'N',
  building_id     INT           NOT NULL,
  deposit         DECIMAL(12,0),
  rent_price      DECIMAL(12,0) NOT NULL,
  manage_fee      DECIMAL(12,0),
  rent_type       ENUM('monthly_rent','stay') NOT NULL DEFAULT 'monthly_rent',
  room_st         ENUM('available','reserved','contracted','repair','cleaning') NOT NULL DEFAULT 'available',
  room_options    VARCHAR(500),
  -- 수용 인원
  room_capacity   INT           NOT NULL DEFAULT 1,
  rent_min        INT,
  sun_direction   ENUM('n','s','w','e'),
  room_desc       VARCHAR(3000),
  delete_yn       VARCHAR(1)    NOT NULL DEFAULT 'N',
  UNIQUE KEY uq_rooms_building_roomno (building_id, room_no),
  KEY ix_rooms_building (building_id),
  KEY ix_rooms_delete (delete_yn),
  KEY ix_rooms_type (room_type),
  KEY ix_rooms_pet_allowed (pet_allowed_yn),
  CONSTRAINT fk_rooms_building FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB;




CREATE TABLE common_space (
  space_id       INT          AUTO_INCREMENT PRIMARY KEY,
  space_nm       VARCHAR(50)  NOT NULL,
  building_id    INT          NOT NULL,
  space_capacity INT,
  space_floor    INT          NOT NULL,
  space_options  VARCHAR(500),
  space_desc     VARCHAR(3000),
  KEY ix_common_space_building (building_id),
  CONSTRAINT fk_common_space_building FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB;


-- ===============================
-- 4) FILES / COMPANY / BANNER
-- ===============================
CREATE TABLE files (
  file_id          INT           AUTO_INCREMENT PRIMARY KEY,
  file_parent_type VARCHAR(50)   NOT NULL,
  file_parent_id   INT,
  file_path        VARCHAR(1000) NOT NULL,
  origin_filename  VARCHAR(260)  NOT NULL,
  rename_filename  VARCHAR(260)  NOT NULL,
  file_size        INT           NOT NULL,
  file_type        VARCHAR(20)   NOT NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  delete_yn        VARCHAR(1)    NOT NULL DEFAULT 'N',
  KEY ix_files_parent  (file_parent_type, file_parent_id),
  KEY ix_files_created (created_at)
) ENGINE=InnoDB;


CREATE TABLE company_info (
  company_id    INT          AUTO_INCREMENT PRIMARY KEY,
  company_nm    VARCHAR(100) NOT NULL,
  company_ceo   VARCHAR(50),
  business_no   VARCHAR(50),
  company_tel   VARCHAR(30),
  company_email VARCHAR(100),
  company_addr  VARCHAR(500),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE banner (
  ban_id     INT          AUTO_INCREMENT PRIMARY KEY,
  start_at   DATETIME     NOT NULL,
  end_at     DATETIME     NOT NULL,
  ban_title  VARCHAR(100) NOT NULL,
  ban_url    VARCHAR(200),
  ban_order  INT          NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ban_st     ENUM('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB;


-- ===============================
-- 5) AFFILIATE & PRODUCT
-- ===============================
CREATE TABLE affiliate (
  affiliate_id       INT          AUTO_INCREMENT PRIMARY KEY,
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
  affiliate_st       ENUM('planned','progress','ended'),
  KEY ix_affiliate_building (building_id),
  CONSTRAINT fk_affiliate_building FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB;


CREATE TABLE product (
  prod_id      INT           AUTO_INCREMENT PRIMARY KEY,
  prod_nm      VARCHAR(50)   NOT NULL,
  prod_price   DECIMAL(12,0) NOT NULL,
  prod_stock   INT           NOT NULL,
  code         VARCHAR(20)   NOT NULL,
  prod_desc    VARCHAR(2000) NOT NULL,
  prod_st      ENUM('on_sale','sold_out') NOT NULL DEFAULT 'on_sale',
  affiliate_id INT,
  KEY ix_product_code (code),
  CONSTRAINT fk_product_code      FOREIGN KEY (code)         REFERENCES common_code(code),
  CONSTRAINT fk_product_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliate(affiliate_id)
) ENGINE=InnoDB;

-- ✅ V2: 빌딩별 상품 재고 테이블 (product 바로 다음에 생성)
CREATE TABLE product_building_stock (
  stock_id    INT      NOT NULL AUTO_INCREMENT,
  prod_id     INT      NOT NULL,
  building_id INT      NOT NULL,
  stock       INT      NOT NULL DEFAULT 0,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stock_id),
  UNIQUE KEY uq_prod_building (prod_id, building_id),
  CONSTRAINT fk_pbs_product  FOREIGN KEY (prod_id)     REFERENCES product(prod_id)      ON DELETE CASCADE,
  CONSTRAINT fk_pbs_building FOREIGN KEY (building_id) REFERENCES building(building_id) ON DELETE CASCADE
) ENGINE=InnoDB;




-- ===============================
-- 6) CONTRACT & RESIDENTS
-- ===============================
CREATE TABLE contract (
  contract_id          INT           AUTO_INCREMENT PRIMARY KEY,
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
  contract_pdf_file_id INT,
  KEY ix_contract_user (user_id),
  KEY ix_contract_room (room_id),
  CONSTRAINT fk_contract_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_contract_room FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;


CREATE TABLE residents (
  resident_id INT         AUTO_INCREMENT PRIMARY KEY,
  building_id INT         NOT NULL,
  contract_id INT         NOT NULL,
  user_id     VARCHAR(50) NOT NULL,
  UNIQUE KEY uq_resident (contract_id, user_id),
  KEY ix_residents_building (building_id),
  CONSTRAINT fk_residents_building FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_residents_contract FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  CONSTRAINT fk_residents_user     FOREIGN KEY (user_id)     REFERENCES users(user_id)
) ENGINE=InnoDB;


-- ===============================
-- 7) RESERVATIONS
-- ===============================
CREATE TABLE room_reservation (
  tour_id       INT         AUTO_INCREMENT PRIMARY KEY,
  building_id   INT         NOT NULL,
  room_id       INT         NOT NULL,
  tour_start_at DATETIME    NOT NULL,
  tour_end_at   DATETIME    NOT NULL,
  tour_nm       VARCHAR(50) NOT NULL,
  tour_tel      VARCHAR(20) NOT NULL,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tour_st       ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',
  tour_pwd      VARCHAR(4),
  KEY ix_room_rsv_building (building_id),
  KEY ix_room_rsv_room     (room_id),
  CONSTRAINT fk_room_rsv_building FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_room_rsv_room     FOREIGN KEY (room_id)     REFERENCES rooms(room_id)
) ENGINE=InnoDB;


CREATE TABLE space_reservations (
  reservation_id INT         AUTO_INCREMENT PRIMARY KEY,
  building_id    INT         NOT NULL,
  space_id       INT         NOT NULL,
  user_id        VARCHAR(50) NOT NULL,
  sr_start_at    DATETIME    NOT NULL,
  sr_end_at      DATETIME    NOT NULL,
  sr_no_people   INT         NOT NULL,
  sr_st          ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',
  CONSTRAINT chk_sr_time CHECK (sr_start_at < sr_end_at),
  KEY ix_space_rsv_building (building_id),
  KEY ix_space_rsv_space    (space_id),
  KEY ix_space_rsv_user     (user_id),
  CONSTRAINT fk_space_rsv_building FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_space_rsv_space    FOREIGN KEY (space_id)    REFERENCES common_space(space_id),
  CONSTRAINT fk_space_rsv_user     FOREIGN KEY (user_id)     REFERENCES users(user_id)
) ENGINE=InnoDB;


-- ===============================
-- 8) COMMUNITY
-- ===============================
CREATE TABLE board (
  board_id    INT          AUTO_INCREMENT PRIMARY KEY,
  board_title VARCHAR(300) NOT NULL,
  user_id     VARCHAR(50)  NOT NULL,
  board_ctnt  LONGTEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  read_count  INT          NOT NULL DEFAULT 0,
  code        VARCHAR(20)  NOT NULL,
  anonymity   VARCHAR(1)   NOT NULL DEFAULT 'N',
  importance  VARCHAR(1)   NOT NULL DEFAULT 'N',
  imp_end_at  DATETIME,
  file_ck     VARCHAR(1)   NOT NULL DEFAULT 'N',
  reply_ck    VARCHAR(1)   NOT NULL DEFAULT 'N',
  KEY ix_board_user (user_id),
  KEY ix_board_code (code),
  CONSTRAINT fk_board_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_board_code FOREIGN KEY (code)    REFERENCES common_code(code)
) ENGINE=InnoDB;


CREATE TABLE reply (
  reply_id   INT           AUTO_INCREMENT PRIMARY KEY,
  board_id   INT           NOT NULL,
  user_id    VARCHAR(50)   NOT NULL,
  reply_ctnt VARCHAR(2000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_id  INT,
  reply_lev  INT           NOT NULL DEFAULT 1,
  reply_seq  INT           NOT NULL DEFAULT 1,
  anonymity VARCHAR(1) NOT NULL DEFAULT 'N',
  KEY ix_reply_board  (board_id),
  KEY ix_reply_user   (user_id),
  KEY ix_reply_parent (parent_id),
  CONSTRAINT fk_reply_board  FOREIGN KEY (board_id)  REFERENCES board(board_id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_user   FOREIGN KEY (user_id)   REFERENCES users(user_id)  ON DELETE CASCADE,
  CONSTRAINT fk_reply_parent FOREIGN KEY (parent_id) REFERENCES reply(reply_id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE board_likes (
  user_id  VARCHAR(50) NOT NULL,
  board_id INT         NOT NULL,
  PRIMARY KEY (user_id, board_id),
  CONSTRAINT fk_board_likes_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)  ON DELETE CASCADE,
  CONSTRAINT fk_board_likes_board FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE reply_likes (
  user_id  VARCHAR(50) NOT NULL,
  reply_id INT         NOT NULL,
  PRIMARY KEY (user_id, reply_id),
  CONSTRAINT fk_reply_likes_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)  ON DELETE CASCADE,
  CONSTRAINT fk_reply_likes_reply FOREIGN KEY (reply_id) REFERENCES reply(reply_id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ===============================
-- 9) SUPPORT (NOTICE / FAQ / QNA / COMPLAIN)
-- ===============================
CREATE TABLE notice (
  notice_id    INT          AUTO_INCREMENT PRIMARY KEY,
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
  code         VARCHAR(20)  NOT NULL,
  KEY ix_notice_user (user_id),
  KEY ix_notice_code (code),
  CONSTRAINT fk_notice_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_notice_code FOREIGN KEY (code)    REFERENCES common_code(code)
) ENGINE=InnoDB;


CREATE TABLE faq (
  faq_id     INT           AUTO_INCREMENT PRIMARY KEY,
  faq_title  VARCHAR(100)  NOT NULL,
  faq_ctnt   VARCHAR(3000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active  INT           NOT NULL DEFAULT 1,
  code       VARCHAR(20)   NOT NULL,
  KEY ix_faq_code (code),
  CONSTRAINT fk_faq_code FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;


CREATE TABLE qna (
  qna_id     INT           AUTO_INCREMENT PRIMARY KEY,
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
  qna_lev    INT           NOT NULL DEFAULT 0,
  KEY ix_qna_user   (user_id),
  KEY ix_qna_code   (code),
  KEY ix_qna_parent (parent_id),
  CONSTRAINT fk_qna_user      FOREIGN KEY (user_id)   REFERENCES users(user_id),
  CONSTRAINT fk_qna_code      FOREIGN KEY (code)      REFERENCES common_code(code),
  CONSTRAINT fk_qna_parent_id FOREIGN KEY (parent_id) REFERENCES qna(qna_id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE complain (
  comp_id    INT           AUTO_INCREMENT PRIMARY KEY,
  comp_title VARCHAR(300)  NOT NULL,
  user_id    VARCHAR(50)   NOT NULL,
  comp_ctnt  VARCHAR(3000),
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  comp_st    ENUM('received', 'in_progress','resolved') NOT NULL DEFAULT 'in_progress',
  code       VARCHAR(20)   NOT NULL,
  file_ck    VARCHAR(1)    NOT NULL DEFAULT 'N',
  reply_ck   VARCHAR(1)    NOT NULL DEFAULT 'N',
  KEY ix_complain_user (user_id),
  KEY ix_complain_code (code),
  CONSTRAINT fk_complain_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_complain_code FOREIGN KEY (code)    REFERENCES common_code(code)
) ENGINE=InnoDB;


-- ===============================
-- 10) REVIEWS
-- ===============================
CREATE TABLE reviews (
  review_id    INT          AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(50)  NOT NULL,
  room_id      INT          NOT NULL,
  rating       INT          NOT NULL,
  review_title VARCHAR(100),
  review_ctnt  VARCHAR(3000),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code         VARCHAR(20),
  file_ck      VARCHAR(1)   NOT NULL DEFAULT 'N',
  reply_ck     VARCHAR(1)   NOT NULL DEFAULT 'N',
  UNIQUE KEY uq_reviews_user_room (user_id, room_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  KEY ix_reviews_room (room_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_reviews_room FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;


-- ===============================
-- 11) NOTIFICATION
-- ===============================
CREATE TABLE notification (
  notification_id INT         AUTO_INCREMENT PRIMARY KEY,
  receiver_id     VARCHAR(50) NOT NULL,
  code            VARCHAR(20) NOT NULL,
  sender_id       VARCHAR(50),
  message        TEXT,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read         VARCHAR(1)  NOT NULL DEFAULT 'N',
  is_read_at      DATETIME,
  target_id       INT,
  target          ENUM('board','reply','notice','tour','space','review','payment'),
  url_path        VARCHAR(260),
  KEY ix_notification_receiver (receiver_id),
  CONSTRAINT fk_notification_receiver FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_sender   FOREIGN KEY (sender_id)   REFERENCES users(user_id)
) ENGINE=InnoDB;


-- ===============================
-- 12) CART
-- ===============================
CREATE TABLE cart (
  cart_id         INT         AUTO_INCREMENT PRIMARY KEY,
  user_id         VARCHAR(50) NOT NULL,
  cart_created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_cart_user (user_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  cart_item_id   INT           AUTO_INCREMENT PRIMARY KEY,
  cart_id        INT           NOT NULL,
  prod_id        INT           NOT NULL,
  building_id    INT           NULL,                   
  order_quantity INT           NOT NULL,
  order_price    DECIMAL(10,0) NOT NULL,
  UNIQUE KEY uq_cart_item (cart_id, prod_id, building_id),   
  KEY ix_cart_items_cart     (cart_id),
  KEY ix_cart_items_prod     (prod_id),
  KEY ix_cart_items_building (building_id),
  CONSTRAINT fk_cart_items_cart     FOREIGN KEY (cart_id)     REFERENCES cart(cart_id)         ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_prod     FOREIGN KEY (prod_id)     REFERENCES product(prod_id),
  CONSTRAINT fk_cart_items_building FOREIGN KEY (building_id) REFERENCES building(building_id) 
) ENGINE=InnoDB;




-- ===============================
-- 13) PAYMENT LOOKUP TABLES
-- ===============================
CREATE TABLE payment_method (
  payment_method_id INT         AUTO_INCREMENT PRIMARY KEY,
  payment_method_nm VARCHAR(50) NOT NULL,
  payment_method_cd VARCHAR(20) NOT NULL,
  is_active         INT         NOT NULL DEFAULT 1,
  UNIQUE KEY uq_payment_method_code (payment_method_cd)
) ENGINE=InnoDB;


CREATE TABLE service_goods (
  service_goods_id INT         AUTO_INCREMENT PRIMARY KEY,
  service_goods_cd VARCHAR(50) NOT NULL,
  service_goods_nm VARCHAR(50) NOT NULL,
  is_active        INT         NOT NULL DEFAULT 1,
  display_order    INT,
  UNIQUE KEY uq_service_goods_cd (service_goods_cd)
) ENGINE=InnoDB;


CREATE TABLE payment_status (
  status_cd     VARCHAR(20)  PRIMARY KEY,
  `description` VARCHAR(255),
  is_terminal   INT          NOT NULL DEFAULT 1,
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB;


CREATE TABLE charge_status (
  status_cd     VARCHAR(20)  PRIMARY KEY,
  `description` VARCHAR(255),
  is_terminal   INT          NOT NULL DEFAULT 1,
  display_order INT,
  is_active     INT          NOT NULL DEFAULT 1
) ENGINE=InnoDB;


-- ===============================
-- 14) PAYMENT & ORDERS
-- ===============================
CREATE TABLE payment (
  payment_id          INT           AUTO_INCREMENT PRIMARY KEY,
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
  paid_at             DATETIME,
  UNIQUE KEY uq_payment_merchant_uid        (merchant_uid),
  UNIQUE KEY uq_payment_user_idempotency    (user_id, idempotency_key),
  UNIQUE KEY uq_payment_provider_payment_id (provider, provider_payment_id),
  KEY ix_payment_user        (user_id),
  KEY ix_payment_provider    (provider, provider_payment_id),
  KEY ix_payment_idempotency (idempotency_key),
  KEY ix_payment_target      (target_type, target_id),
  CONSTRAINT fk_payment_user          FOREIGN KEY (user_id)           REFERENCES users(user_id),
  CONSTRAINT fk_payment_method        FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id),
  CONSTRAINT fk_payment_service_goods FOREIGN KEY (service_goods_id)  REFERENCES service_goods(service_goods_id),
  CONSTRAINT chk_payment_target_type  CHECK (target_type IN ('order', 'monthly_charge'))
) ENGINE=InnoDB;


CREATE TABLE orders (
  order_id         INT           AUTO_INCREMENT PRIMARY KEY,
  user_id          VARCHAR(50)   NOT NULL,
  order_st         ENUM('ordered','paid','ended','cancelled') NOT NULL DEFAULT 'ordered',
  total_price      DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_id       INT,
  order_created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_orders_user    (user_id),
  KEY ix_orders_payment (payment_id),
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)    REFERENCES users(user_id),
  CONSTRAINT fk_orders_payment FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;


CREATE TABLE order_items (
  order_item_id  INT           AUTO_INCREMENT PRIMARY KEY,
  order_id       INT           NOT NULL,
  prod_id        INT           NOT NULL,
  building_id    INT           NULL,                         
  order_quantity INT           NOT NULL,
  order_price    DECIMAL(12,0) NOT NULL,
  KEY ix_order_items_order    (order_id),
  KEY ix_order_items_prod     (prod_id),
  KEY ix_order_items_building (building_id),
  CONSTRAINT fk_order_items_order    FOREIGN KEY (order_id)    REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_product  FOREIGN KEY (prod_id)     REFERENCES product(prod_id),
  CONSTRAINT fk_order_items_building FOREIGN KEY (building_id) REFERENCES building(building_id) -- 
) ENGINE=InnoDB;


CREATE TABLE room_service_order (
  order_id          INT           AUTO_INCREMENT PRIMARY KEY,
  parent_order_id   INT           NOT NULL,
  user_id           VARCHAR(50)   NOT NULL,
  room_id           INT           NOT NULL,
  total_price       DECIMAL(12,0) NOT NULL,
  order_st          ENUM('requested','paid','delivered','cancelled') NOT NULL DEFAULT 'requested',
  room_service_desc VARCHAR(200),
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_rso_parent_order (parent_order_id),
  KEY ix_rso_user         (user_id),
  KEY ix_rso_room         (room_id),
  CONSTRAINT fk_rso_parent_order FOREIGN KEY (parent_order_id) REFERENCES orders(order_id),
  CONSTRAINT fk_rso_user         FOREIGN KEY (user_id)         REFERENCES users(user_id),
  CONSTRAINT fk_rso_room         FOREIGN KEY (room_id)         REFERENCES rooms(room_id)
) ENGINE=InnoDB;


CREATE TABLE monthly_charge (
  charge_id   INT           AUTO_INCREMENT PRIMARY KEY,
  contract_id INT           NOT NULL,
  charge_type VARCHAR(30)   NOT NULL,
  billing_dt  CHAR(7)       NOT NULL,
  price       DECIMAL(12,0) NOT NULL,
  charge_st   VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
  payment_id  INT,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_monthly_charge_contract (contract_id),
  KEY ix_monthly_charge_billing  (billing_dt),
  CONSTRAINT fk_monthly_charge_contract FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  CONSTRAINT fk_monthly_charge_payment  FOREIGN KEY (payment_id)  REFERENCES payment(payment_id)
) ENGINE=InnoDB;


CREATE TABLE payment_attempt (
  attempt_id  INT      AUTO_INCREMENT PRIMARY KEY,
  payment_id  INT      NOT NULL,
  attempt_st  ENUM('requested','approved','failed') NOT NULL DEFAULT 'failed',
  finished_at DATETIME,
  KEY ix_payment_attempt (payment_id),
  CONSTRAINT fk_payment_attempt FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;


CREATE TABLE payment_refund (
  refund_id     INT           AUTO_INCREMENT PRIMARY KEY,
  payment_id    INT           NOT NULL,
  refund_price  DECIMAL(12,0),
  refund_st     ENUM('requested','done','failed'),
  refund_reason VARCHAR(255),
  completed_at  DATETIME,
  KEY ix_payment_refund (payment_id),
  CONSTRAINT fk_payment_refund FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;


CREATE TABLE payment_intent (
  payment_intent_id    BIGINT        AUTO_INCREMENT PRIMARY KEY,
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
  updated_at           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY ix_payment_intent_payment      (payment_id),
  KEY ix_payment_intent_provider_ref (provider, provider_ref_id),
  UNIQUE KEY uq_payment_intent_provider_ref (provider, provider_ref_id),
  CONSTRAINT fk_payment_intent_payment FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;


SET FOREIGN_KEY_CHECKS = 1;



