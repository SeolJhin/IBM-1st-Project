/* =========================================================
 * Uni-Place : CREATE TABLES ONLY (NO PK / FK / UK / IDX / CHECK)
 * - 컬럼/타입/DEFAULT만 유지
 * - MySQL 8.x 기준
 * ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

/* 0) COMMON CODES */
CREATE TABLE IF NOT EXISTS group_common_code (
  group_code VARCHAR(20),
  group_code_name VARCHAR(100) NOT NULL,
  description VARCHAR(100),
  is_active INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS common_code (
  group_code VARCHAR(20) NOT NULL,
  code VARCHAR(20) NOT NULL,
  code_value VARCHAR(100) NOT NULL,
  description VARCHAR(100),
  display_order INT,
  is_active INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

/* 1) CORE */
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(50),
  user_nm VARCHAR(50) NOT NULL,
  user_email VARCHAR(100) NOT NULL,
  user_pwd VARCHAR(255) NOT NULL,
  user_birth DATE NOT NULL,
  user_tel VARCHAR(20) NOT NULL,

  user_role ENUM('admin','user','tenant') NOT NULL DEFAULT 'user',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,

  user_st ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  delete_yn CHAR(1) NOT NULL DEFAULT 'N'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  refresh_token_id VARCHAR(36),
  user_id VARCHAR(50) NOT NULL,

  token_hash CHAR(64) NOT NULL,

  device_id VARCHAR(100) NOT NULL,
  user_agent VARCHAR(300),
  ip VARCHAR(45),

  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,

  revoked TINYINT(1) NOT NULL DEFAULT 0,
  revoked_at DATETIME,

  last_used_at DATETIME,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS building (
  building_id INT,
  building_nm VARCHAR(50) NOT NULL,
  building_addr VARCHAR(500) NOT NULL,
  building_desc VARCHAR(500),
  land_category VARCHAR(20),
  build_size DECIMAL(5,2),
  building_usage VARCHAR(20),
  exist_elv CHAR(1),
  parking_capacity INT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rooms (
  room_id INT,
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
  room_desc VARCHAR(3000)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS common_space (
  space_id INT,
  space_nm VARCHAR(50) NOT NULL,
  building_id INT NOT NULL,
  space_capacity INT,
  space_floor INT NOT NULL,
  space_options VARCHAR(500),
  space_desc VARCHAR(3000)
) ENGINE=InnoDB;

/* 2) FILES */
CREATE TABLE IF NOT EXISTS files (
  file_id INT,
  file_parent_type VARCHAR(50) NOT NULL,
  file_parent_id INT,
  file_path VARCHAR(1000) NOT NULL,
  origin_filename VARCHAR(260) NOT NULL,
  rename_filename VARCHAR(260) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delete_yn CHAR(1) NOT NULL DEFAULT 'N'
) ENGINE=InnoDB;

/* 3) RESERVATION */
CREATE TABLE IF NOT EXISTS room_reservation (
  tour_id INT,
  building_id INT NOT NULL,
  room_id INT NOT NULL,

  tour_start_at DATETIME NOT NULL,
  tour_end_at DATETIME NOT NULL,

  tour_nm VARCHAR(50) NOT NULL,
  tour_tel VARCHAR(20) NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  tour_st ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested',
  tour_pwd VARCHAR(4)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS space_reservations (
  reservation_id INT,
  building_id INT NOT NULL,
  space_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,

  sr_start_at DATETIME NOT NULL,
  sr_end_at DATETIME NOT NULL,
  sr_no_people INT NOT NULL,

  sr_st ENUM('requested','confirmed','ended','cancelled') NOT NULL DEFAULT 'requested'
) ENGINE=InnoDB;

/* 4) AFFILIATE / PRODUCT */
CREATE TABLE IF NOT EXISTS affiliate (
  affiliate_id INT,
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
  affiliate_st ENUM('planned','progress','ended')
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product (
  prod_id INT,
  prod_nm VARCHAR(50) NOT NULL,
  prod_price DECIMAL(12,0) NOT NULL,
  prod_stock INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  prod_desc VARCHAR(2000),
  prod_st ENUM('on_sale','sold_out') NOT NULL DEFAULT 'on_sale',
  affiliate_id INT
) ENGINE=InnoDB;

/* 5) CONTRACT / RESIDENTS */
CREATE TABLE IF NOT EXISTS contract (
  contract_id INT,
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

  rent_type ENUM('monthly_rent','stay') NOT NULL DEFAULT 'monthly_rent'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS residents (
  resident_id INT,
  building_id INT NOT NULL,
  contract_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

/* 6) CART */
CREATE TABLE IF NOT EXISTS cart (
  cart_id INT,
  user_id VARCHAR(50) NOT NULL,
  cart_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
  cart_item_id INT,
  cart_id INT NOT NULL,
  prod_id INT NOT NULL,
  order_quantity INT NOT NULL,
  order_price DECIMAL(10,0) NOT NULL
) ENGINE=InnoDB;

/* 7) COMMUNITY / BOARD */
CREATE TABLE IF NOT EXISTS board (
  board_id INT,
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
  reply_ck CHAR(1) NOT NULL DEFAULT 'N'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reply (
  reply_id INT,
  board_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  reply_ctnt VARCHAR(2000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  parent_id INT,
  reply_lev INT NOT NULL DEFAULT 1,
  reply_seq INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS board_likes (
  user_id VARCHAR(50) NOT NULL,
  board_id INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reply_likes (
  user_id VARCHAR(50) NOT NULL,
  reply_id INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qna (
  qna_id INT,
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
  qna_lev INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notice (
  notice_id INT,
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
  code VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faq (
  faq_id INT,
  faq_title VARCHAR(100) NOT NULL,
  faq_ctnt VARCHAR(3000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active INT NOT NULL DEFAULT 1,
  code VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS complain (
  comp_id INT,
  comp_title VARCHAR(300) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  comp_ctnt VARCHAR(3000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  comp_st ENUM('in_progress','resolved') NOT NULL DEFAULT 'in_progress',
  code VARCHAR(20) NOT NULL,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N'
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT,
  user_id VARCHAR(50) NOT NULL,
  room_id INT NOT NULL,
  rating INT NOT NULL,
  review_title VARCHAR(100),
  review_ctnt VARCHAR(3000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  code VARCHAR(20) NOT NULL,
  file_ck CHAR(1) NOT NULL DEFAULT 'N',
  reply_ck CHAR(1) NOT NULL DEFAULT 'N'
) ENGINE=InnoDB;

/* 8) NOTIFICATION */
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT,
  receiver_id VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  sender_id VARCHAR(50),
  message VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_read CHAR(1) NOT NULL DEFAULT 'N',
  is_read_at DATETIME,
  target_id INT,
  target ENUM('board','reply','notice'),
  url_path VARCHAR(260)
) ENGINE=InnoDB;

/* 9) COMPANY / BANNER */
CREATE TABLE IF NOT EXISTS company_info (
  company_id INT,
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
  ban_id INT,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  ban_title VARCHAR(100) NOT NULL,
  ban_url VARCHAR(200),
  ban_order INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ban_st ENUM('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB;

/* 10) PAYMENT / ORDER / CHARGE */
CREATE TABLE IF NOT EXISTS payment_method (
  payment_method_id INT,
  payment_method_nm VARCHAR(50) NOT NULL,
  payment_method_cd VARCHAR(20) NOT NULL,
  is_active INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service_goods (
  service_goods_id INT,
  service_goods_cd VARCHAR(50) NOT NULL,
  service_goods_nm VARCHAR(50) NOT NULL,
  is_active INT NOT NULL DEFAULT 1,
  display_order INT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_status (
  status_cd VARCHAR(20),
  `desc` VARCHAR(255),
  is_terminal INT NOT NULL DEFAULT 1,
  display_order INT,
  is_active INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS charge_status (
  status_cd VARCHAR(20),
  `desc` VARCHAR(255),
  is_terminal INT NOT NULL DEFAULT 1,
  display_order INT,
  is_active INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment (
  payment_id INT,
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
  paid_at DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  order_id INT,
  user_id VARCHAR(50) NOT NULL,
  order_st ENUM('ordered','paid','ended','cancelled') NOT NULL DEFAULT 'ordered',
  total_price DECIMAL(12,0) NOT NULL DEFAULT 0,
  payment_id INT,
  order_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT,
  order_id INT NOT NULL,
  prod_id INT NOT NULL,
  order_quantity INT NOT NULL,
  order_price DECIMAL(12,0) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS room_service_order (
  order_id INT,
  user_id VARCHAR(50) NOT NULL,
  room_id INT NOT NULL,
  total_price DECIMAL(12,0) NOT NULL,
  order_st VARCHAR(20) NOT NULL DEFAULT 'requested',
  payment_id INT,
  room_service_desc VARCHAR(200),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monthly_charge (
  charge_id INT,
  contract_id INT NOT NULL,
  charge_type VARCHAR(30) NOT NULL,
  billing_dt CHAR(7) NOT NULL,
  price DECIMAL(12,0) NOT NULL,
  charge_st VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  payment_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_attempt (
  attempt_id INT,
  payment_id INT NOT NULL,
  attempt_st ENUM('requested','approved','failed') NOT NULL DEFAULT 'failed',
  finished_at DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_refund (
  refund_id INT,
  payment_id INT NOT NULL,
  refund_price DECIMAL(12,0),
  refund_st ENUM('requested','done','failed'),
  refund_reason VARCHAR(255),
  completed_at DATETIME
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
