/* =========================================================
 * Uni-Place : CREATE SCRIPT (부모 -> 자식 순)
 * - FK 충돌 없이 순서 보장
 * - 한번에 복사/실행 가능
 * - MySQL 8.x 기준
 * ========================================================= */

DROP TABLE IF EXISTS payment_refund;
DROP TABLE IF EXISTS payment_attempt;
DROP TABLE IF EXISTS payment_intent;

DROP TABLE IF EXISTS order_items;

DROP TABLE IF EXISTS monthly_charge;
DROP TABLE IF EXISTS room_service_order;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS payment;

/* code tables not FK-linked, but safe to drop after payment */
DROP TABLE IF EXISTS payment_method;
DROP TABLE IF EXISTS service_goods;
DROP TABLE IF EXISTS payment_status;
DROP TABLE IF EXISTS charge_status;

/* ===== 2) CART ===== */
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;

/* ===== 3) COMMUNITY / BOARD ===== */
DROP TABLE IF EXISTS reply_likes;
DROP TABLE IF EXISTS board_likes;
DROP TABLE IF EXISTS reply;

DROP TABLE IF EXISTS qna;

DROP TABLE IF EXISTS complain;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS faq;
DROP TABLE IF EXISTS notice;
DROP TABLE IF EXISTS board;

/* ===== 4) RESERVATION ===== */
DROP TABLE IF EXISTS space_reservations;
DROP TABLE IF EXISTS room_reservation;

/* ===== 5) CONTRACT / RESIDENTS ===== */
DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS contract;

/* ===== 6) PRODUCT / AFFILIATE ===== */
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS affiliate;

/* ===== 7) CORE SPACE/ROOM/BUILDING ===== */
DROP TABLE IF EXISTS common_space;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS building;

/* ===== 8) MISC ===== */
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS banner;
DROP TABLE IF EXISTS company_info;

/* ===== 9) AUTH ===== */
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS social_accounts;
DROP TABLE IF EXISTS users;

/* ===== 10) COMMON CODES (parents last) ===== */
DROP TABLE IF EXISTS common_code;
DROP TABLE IF EXISTS group_common_code;

SET FOREIGN_KEY_CHECKS = 1;


SET FOREIGN_KEY_CHECKS = 0;

/* =========================================================
 * 0) COMMON CODES
 * ========================================================= */
CREATE TABLE IF NOT EXISTS group_common_code (
  group_code VARCHAR(20) PRIMARY KEY,
  group_code_name VARCHAR(100) NOT NULL,
  description VARCHAR(100),
  is_active INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_group_code_name (group_code_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS common_code (
  group_code VARCHAR(20) NOT NULL,
  code VARCHAR(20) NOT NULL,
  code_value VARCHAR(100) NOT NULL,
  description VARCHAR(100),
  display_order INT,
  is_active INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ,
  PRIMARY KEY (code),
  KEY ix_common_code_group (group_code),
  CONSTRAINT fk_common_code_group
    FOREIGN KEY (group_code) REFERENCES group_common_code(group_code)
) ENGINE=InnoDB;

/* =========================================================
 * 1) CORE
 * ========================================================= */
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50) PRIMARY KEY,
  user_nm VARCHAR(50) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  user_pwd VARCHAR(255) NOT NULL,
  user_birth DATE NOT NULL,
  user_tel VARCHAR(20) NOT NULL,

  user_role ENUM('admin','user','tenant') NOT NULL DEFAULT 'user',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  last_login_at DATETIME,
  first_sign CHAR(1)  NOT NULL DEFAULT 'Y',

  user_st ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  delete_yn VARCHAR(1) NOT NULL DEFAULT 'N',

  UNIQUE KEY uq_users_email (user_email),
  KEY ix_users_tel (user_tel)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  refresh_token_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,

  token_hash VARCHAR(64) NOT NULL,

  device_id VARCHAR(100) NOT NULL,
  user_agent VARCHAR(300),
  ip VARCHAR(45),

  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,

  revoked TINYINT(1) NOT NULL DEFAULT 0,
  revoked_at DATETIME,

  last_used_at DATETIME,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_refresh_token_hash (token_hash),

  KEY ix_refresh_tokens_user (user_id),
  KEY ix_refresh_tokens_device (user_id, device_id),
  KEY ix_refresh_tokens_expires (expires_at),

  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS social_accounts(
  social_account_id INT AUTO_INCREMENT PRIMARY KEY,

  user_id VARCHAR(50) NOT NULL,

  provider VARCHAR(20) NOT NULL,

  provider_user_id VARCHAR(50) 
    NOT NULL,

  provider_email VARCHAR(255),

  created_at DATETIME 
    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at DATETIME 
    NULL DEFAULT NULL 
    ON UPDATE CURRENT_TIMESTAMP,

  -- 같은 소셜 계정이 여러 유저에 연결되는 것 방지
  CONSTRAINT uq_oauth_provider_user 
    UNIQUE (provider, provider_user_id),

  -- FK 설정
  CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

  -- 조회 성능용 인덱스
  KEY ix_oauth_user (user_id)

) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS building (
  building_id INT AUTO_INCREMENT PRIMARY KEY,
  building_nm VARCHAR(50) NOT NULL,
  building_addr VARCHAR(500) NOT NULL,
  building_desc VARCHAR(500),
  land_category VARCHAR(20),
  build_size DECIMAL(5,2),
  building_usage VARCHAR(20),
  exist_elv VARCHAR(1),
  parking_capacity INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
  room_id INT AUTO_INCREMENT PRIMARY KEY,
  room_no INT NOT NULL,
  floor INT NOT NULL,
  room_size DECIMAL(5,2) NOT NULL,
  building_id INT NOT NULL,

  deposit DECIMAL(12,0),
  rent_price DECIMAL(12,0) NOT NULL,
  manage_fee DECIMAL(12,0),

  rent_type ENUM('monthly_rent','stay') NOT NULL DEFAULT 'monthly_rent',
  room_st ENUM('available','reserved','contracted','repair','cleaning') NOT NULL DEFAULT 'available',

  room_options VARCHAR(500),
  room_capacity INT NOT NULL DEFAULT 1,
  rent_min INT,
  sun_direction ENUM('n','s','w','e'),
  room_desc VARCHAR(3000),

  UNIQUE KEY uq_rooms_building_roomno (building_id, room_no),
  KEY ix_rooms_building (building_id),

  CONSTRAINT fk_rooms_building
    FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS common_space (
  space_id INT AUTO_INCREMENT PRIMARY KEY,
  space_nm VARCHAR(50) NOT NULL,
  building_id INT NOT NULL,
  space_capacity INT,
  space_floor INT NOT NULL,
  space_options VARCHAR(500),
  space_desc VARCHAR(3000),

  KEY ix_common_space_building (building_id),
  CONSTRAINT fk_common_space_building
    FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB;

/* =========================================================
 * 2) FILES (폴리모픽 참조: FK 없음)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS files (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  file_parent_type VARCHAR(50) NOT NULL,
  file_parent_id INT,
  file_path VARCHAR(1000) NOT NULL,
  origin_filename VARCHAR(260) NOT NULL,
  rename_filename VARCHAR(260) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP NULL,
  ON  CURRENT_TIMESTAMP,

  delete_yn CHAR(1) NOT NULL DEFAULT 'N',

  KEY ix_files_parent (file_parent_type, file_parent_id),
  KEY ix_files_created (created_at)
) ENGINE=InnoDB;

/* =========================================================
 * 3) RESERVATION
 * ========================================================= */
CREATE TABLE IF NOT EXISTS room_reservation (
  tour_id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  room_id INT NOT NULL,

  tour_start_at DATETIME NOT NULL,
  tour_end_at DATETIME NOT NULL,

  tour_nm VARCHAR(50) NOT NULL,
  tour_tel VARCHAR(20) NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ,

  tour_st ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',
  tour_pwd VARCHAR(4),

  KEY ix_room_reservation_building (building_id),
  KEY ix_room_reservation_room (room_id),
  KEY ix_room_reservation_time (tour_start_at, tour_end_at),

  CONSTRAINT fk_room_reservation_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_room_reservation_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS space_reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  space_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,

  sr_start_at DATETIME NOT NULL,
  sr_end_at DATETIME NOT NULL,
  sr_no_people INT NOT NULL,

  sr_st ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',

  UNIQUE KEY uq_space_time (space_id, sr_start_at, sr_end_at),
  KEY ix_sr_user (user_id),
  KEY ix_sr_time (sr_start_at, sr_end_at),

  CONSTRAINT fk_sr_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_sr_space
    FOREIGN KEY (space_id) REFERENCES common_space(space_id),
  CONSTRAINT fk_sr_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

/* =========================================================
 * 4) AFFILIATE / PRODUCT
 * ========================================================= */
CREATE TABLE IF NOT EXISTS affiliate (
  affiliate_id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  affiliate_nm VARCHAR(50) NOT NULL,
  affiliate_ceo VARCHAR(50),
  affiliate_tel VARCHAR(30),
  business_no VARCHAR(50),
  affiliate_fax VARCHAR(30),
  affiliate_email VARCHAR(100),
  affiliate_addr VARCHAR(500),
  affiliate_start_at DATETIME,
  affiliate_end_at DATETIME,
  code VARCHAR(20),
  affiliate_desc VARCHAR(3000),
  affiliate_st ENUM('planned','progress','ended'),

  KEY ix_affiliate_building (building_id),
  KEY ix_affiliate_code (code),

  CONSTRAINT fk_affiliate_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_affiliate_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product (
  prod_id INT AUTO_INCREMENT PRIMARY KEY,
  prod_nm VARCHAR(50) NOT NULL,
  prod_price DECIMAL(12,0) NOT NULL,
  prod_stock INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  prod_desc VARCHAR(2000),
  prod_st ENUM('on_sale','sold_out') NOT NULL DEFAULT 'on_sale',
  affiliate_id INT,

  KEY ix_product_code (code),
  KEY ix_product_affiliate (affiliate_id),

  CONSTRAINT fk_product_affiliate
    FOREIGN KEY (affiliate_id) REFERENCES affiliate(affiliate_id),
  CONSTRAINT fk_product_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

/* =========================================================
 * 5) CONTRACT / RESIDENTS
 * ========================================================= */
CREATE TABLE IF NOT EXISTS contract (
  contract_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  room_id INT NOT NULL,

  contract_start DATE NOT NULL,
  contract_end DATE NOT NULL,

  deposit DECIMAL(12,0),
  rent_price DECIMAL(12,0) NOT NULL,
  manage_fee DECIMAL(12,0),

  payment_day INT NOT NULL,
  contract_st ENUM('requested','active','ended','cancelled') NOT NULL DEFAULT 'requested',
  sign_at DATETIME,
  movein_at DATETIME,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  rent_type ENUM('monthly_rent','stay') NOT NULL DEFAULT 'monthly_rent',

  KEY ix_contract_user (user_id),
  KEY ix_contract_room (room_id),

  CONSTRAINT fk_contract_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_contract_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS residents (
  resident_id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  contract_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,

  UNIQUE KEY uq_resident (contract_id, user_id),

  KEY ix_residents_building (building_id),
  KEY ix_residents_user (user_id),

  CONSTRAINT fk_residents_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  CONSTRAINT fk_residents_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  CONSTRAINT fk_residents_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

/* =========================================================
 * 6) CART
 * ========================================================= */
CREATE TABLE IF NOT EXISTS cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  cart_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY ix_cart_user (user_id),
  CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  prod_id INT NOT NULL,
  order_quantity INT NOT NULL,
  order_price DECIMAL(10,0) NOT NULL,

  UNIQUE KEY uq_cart_item (cart_id, prod_id),
  KEY ix_cart_items_cart (cart_id),
  KEY ix_cart_items_prod (prod_id),

  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (prod_id) REFERENCES product(prod_id)
) ENGINE=InnoDB;

/* =========================================================
 * 7) COMMUNITY / BOARD
 * ========================================================= */
CREATE TABLE IF NOT EXISTS board (
  board_id INT AUTO_INCREMENT PRIMARY KEY,
  board_title VARCHAR(300) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  board_ctnt VARCHAR(3000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  read_count INT NOT NULL DEFAULT 0,
  code VARCHAR(20) NOT NULL,
  anonymity CHAR(1) NOT NULL DEFAULT 'N',
  importance CHAR(1) NOT NULL DEFAULT 'N',
  imp_end_at DATETIME,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N',

  KEY ix_board_user (user_id),
  KEY ix_board_code (code),
  KEY ix_board_created (created_at),

  CONSTRAINT fk_board_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_board_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reply (
  reply_id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  reply_ctnt VARCHAR(2000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_id INT,
  reply_lev INT NOT NULL DEFAULT 1,
  reply_seq INT NOT NULL DEFAULT 1,

  KEY ix_reply_board (board_id),
  KEY ix_reply_user (user_id),
  KEY ix_reply_parent (parent_id),

  CONSTRAINT fk_reply_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_parent
    FOREIGN KEY (parent_id) REFERENCES reply(reply_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS board_likes (
  user_id VARCHAR(50) NOT NULL,
  board_id INT NOT NULL,
  PRIMARY KEY (user_id, board_id),
  KEY ix_board_likes_board (board_id),
  CONSTRAINT fk_board_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_board_likes_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reply_likes (
  user_id VARCHAR(50) NOT NULL,
  reply_id INT NOT NULL,
  PRIMARY KEY (user_id, reply_id),
  KEY ix_reply_likes_reply (reply_id),
  CONSTRAINT fk_reply_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_likes_reply
    FOREIGN KEY (reply_id) REFERENCES reply(reply_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qna (
  qna_id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT,
  qna_title VARCHAR(255) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  qna_st ENUM('waiting','complete') NOT NULL DEFAULT 'waiting',
  read_count INT NOT NULL DEFAULT 0,
  qna_ctnt VARCHAR(4000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code VARCHAR(20) NOT NULL,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N',
  group_id INT,
  qna_lev INT NOT NULL DEFAULT 0,

  KEY ix_qna_user (user_id),
  KEY ix_qna_parent (parent_id),
  KEY ix_qna_code (code),

  CONSTRAINT fk_qna_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_qna_code
    FOREIGN KEY (code) REFERENCES common_code(code),
  CONSTRAINT fk_qna_parent
    FOREIGN KEY (parent_id) REFERENCES qna(qna_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notice (
  notice_id INT AUTO_INCREMENT PRIMARY KEY,
  notice_title VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id VARCHAR(50) NOT NULL,
  notice_ctnt VARCHAR(3000),
  importance CHAR(1) NOT NULL DEFAULT 'N',
  imp_end_at DATETIME,
  read_count INT NOT NULL DEFAULT 0,
  notice_st VARCHAR(30) NOT NULL DEFAULT 'notice',
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  code VARCHAR(20) NOT NULL,

  KEY ix_notice_user (user_id),
  KEY ix_notice_code (code),

  CONSTRAINT fk_notice_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_notice_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faq (
  faq_id INT AUTO_INCREMENT PRIMARY KEY,
  faq_title VARCHAR(100) NOT NULL,
  faq_ctnt VARCHAR(3000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  is_active INT NOT NULL DEFAULT 1,
  code VARCHAR(20) NOT NULL,

  KEY ix_faq_code (code),
  CONSTRAINT fk_faq_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS complain (
  comp_id INT AUTO_INCREMENT PRIMARY KEY,
  comp_title VARCHAR(300) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  comp_ctnt VARCHAR(3000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  comp_st ENUM('in_progress','resolved') NOT NULL DEFAULT 'in_progress',
  code VARCHAR(20) NOT NULL,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N',

  KEY ix_complain_user (user_id),
  KEY ix_complain_code (code),

  CONSTRAINT fk_complain_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_complain_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  room_id INT NOT NULL,
  rating INT NOT NULL,
  review_title VARCHAR(100),
  review_ctnt VARCHAR(3000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code VARCHAR(20) NOT NULL,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N',

  UNIQUE KEY uq_review_user_room (user_id, room_id),
  KEY ix_reviews_room (room_id),
  KEY ix_reviews_code (code),

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_reviews_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  CONSTRAINT fk_reviews_code
    FOREIGN KEY (code) REFERENCES common_code(code)
) ENGINE=InnoDB;

/* =========================================================
 * 8) NOTIFICATION
 * ========================================================= */
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  receiver_id VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  sender_id VARCHAR(50),
  message VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read CHAR(1) NOT NULL DEFAULT 'N',
  is_read_at DATETIME,
  target_id INT,
  target ENUM('board','reply','notice'),
  url_path VARCHAR(260),

  KEY ix_notification_receiver (receiver_id),
  KEY ix_notification_sender (sender_id),
  KEY ix_notification_created (created_at),

  CONSTRAINT fk_notification_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

/* =========================================================
 * 9) COMPANY / BANNER
 * ========================================================= */
CREATE TABLE IF NOT EXISTS company_info (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  company_nm VARCHAR(100) NOT NULL,
  company_ceo VARCHAR(50),
  business_no VARCHAR(50),
  company_tel VARCHAR(30),
  company_email VARCHAR(100),
  company_addr VARCHAR(500),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS banner (
  ban_id INT AUTO_INCREMENT PRIMARY KEY,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  ban_title VARCHAR(100) NOT NULL,
  ban_url VARCHAR(200),
  ban_order INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ban_st ENUM('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB;

/* =========================================================
 * 10) PAYMENT / ORDER / CHARGE
 * ========================================================= */
CREATE TABLE IF NOT EXISTS payment_method (
  payment_method_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_method_nm VARCHAR(50) NOT NULL,
  payment_method_cd VARCHAR(20) NOT NULL,
  is_active INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_payment_method_code (payment_method_cd)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_goods (
  service_goods_id INT AUTO_INCREMENT PRIMARY KEY,
  service_goods_cd VARCHAR(50) NOT NULL,
  service_goods_nm VARCHAR(50) NOT NULL,
  is_active INT NOT NULL DEFAULT 1,
  display_order INT,
  UNIQUE KEY uq_service_goods_cd (service_goods_cd)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_status (
  status_cd VARCHAR(20) PRIMARY KEY,
  `desc` VARCHAR(255),
  is_terminal INT NOT NULL DEFAULT 1,
  display_order INT,
  is_active INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS charge_status (
  status_cd VARCHAR(20) PRIMARY KEY,
  `desc` VARCHAR(255),
  is_terminal INT NOT NULL DEFAULT 1,
  display_order INT,
  is_active INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  service_goods_id INT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KRW',
  total_price DECIMAL(12,0) NOT NULL,
  captured_price DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_method_id INT,
  provider VARCHAR(20) NOT NULL,
  provider_payment_id VARCHAR(100),
  tax_scope_price DECIMAL(12,0),
  tax_ex_scope_price DECIMAL(12,0),
  tax_free_price DECIMAL(12,0),
  payment_st VARCHAR(20) NOT NULL DEFAULT 'ready',
  paid_at DATETIME,

  KEY ix_payment_user (user_id),
  KEY ix_payment_provider (provider, provider_payment_id),

  CONSTRAINT fk_payment_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id),
  CONSTRAINT fk_payment_service_goods
    FOREIGN KEY (service_goods_id) REFERENCES service_goods(service_goods_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  order_st ENUM('ordered','paid','ended','cancelled') NOT NULL DEFAULT 'ordered',
  total_price DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_id INT,
  order_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY ix_orders_user (user_id),
  KEY ix_orders_payment (payment_id),

  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_orders_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  prod_id INT NOT NULL,
  order_quantity INT NOT NULL,
  order_price DECIMAL(12,0) NOT NULL,

  KEY ix_order_items_order (order_id),
  KEY ix_order_items_prod (prod_id),

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (prod_id) REFERENCES product(prod_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_service_order (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  room_id INT NOT NULL,
  total_price DECIMAL(12,0) NOT NULL,
  order_st VARCHAR(20) NOT NULL DEFAULT 'requested',
  payment_id INT,
  room_service_desc VARCHAR(200),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ,

  KEY ix_rso_user (user_id),
  KEY ix_rso_room (room_id),
  KEY ix_rso_payment (payment_id),

  CONSTRAINT fk_rso_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_rso_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  CONSTRAINT fk_rso_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monthly_charge (
  charge_id INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  charge_type VARCHAR(30) NOT NULL,
  billing_dt CHAR(7) NOT NULL,
  price DECIMAL(12,0) NOT NULL,
  charge_st VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  payment_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY ix_monthly_charge_contract (contract_id),
  KEY ix_monthly_charge_billing (billing_dt),

  CONSTRAINT fk_monthly_charge_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  CONSTRAINT fk_monthly_charge_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_attempt (
  attempt_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  attempt_st ENUM('requested','approved','failed') NOT NULL DEFAULT 'failed',
  finished_at DATETIME,

  KEY ix_payment_attempt_payment (payment_id),
  CONSTRAINT fk_payment_attempt_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_refund (
  refund_id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  refund_price DECIMAL(12,0),
  refund_st ENUM('requested','done','failed'),
  refund_reason VARCHAR(255),
  completed_at DATETIME,

  KEY ix_payment_refund_payment (payment_id),
  CONSTRAINT fk_payment_refund_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_intent (
  payment_intent_id BIGINT AUTO_INCREMENT PRIMARY KEY,

  payment_id INT NOT NULL,

  intent_st ENUM(
    'CREATED',
    'READY_OK',
    'READY_FAIL',
    'RETURNED',
    'APPROVE_OK',
    'APPROVE_FAIL',
    'CANCELED'
  ) NOT NULL DEFAULT 'CREATED',

  provider_ref_id VARCHAR(100),

  -- PAYCO 앱스위치/리다이렉트에 필요한 최소
  app_scheme_url VARCHAR(2000),
  return_url VARCHAR(1000),

  -- 벤더별 파라미터/키/원본은 컬럼 늘리지 말고 JSON에 몰아넣기
  returned_params_json JSON,
  pg_ready_json JSON,
  pg_approve_json JSON,

  fail_code VARCHAR(20),
  fail_message VARCHAR(255),

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY ix_payment_intent_payment (payment_id),
  KEY ix_payment_intent_ref (provider_ref_id),

  -- 같은 payment 안에서 provider_ref_id 중복 방지(정상 플로우에서 중복이면 거의 오류)
  UNIQUE KEY uq_payment_intent_payment_ref (payment_id, provider_ref_id),

  CONSTRAINT fk_payment_intent_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;



