/* =========================================================
 * 0) DROP (child -> parent) : FK 고려 + 반복 실행 안전
 * ========================================================= */
SET FOREIGN_KEY_CHECKS = 0;


DROP TABLE IF EXISTS refresh_tokens;

DROP TABLE IF EXISTS payment_refund;
DROP TABLE IF EXISTS payment_attempt;

DROP TABLE IF EXISTS order_items;

DROP TABLE IF EXISTS reply_likes;
DROP TABLE IF EXISTS board_likes;
DROP TABLE IF EXISTS reply;

DROP TABLE IF EXISTS space_reservations;
DROP TABLE IF EXISTS room_reservation;

DROP TABLE IF EXISTS cart;

DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS monthly_charge;

DROP TABLE IF EXISTS room_service_order;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notification;

DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS files;

DROP TABLE IF EXISTS complain;
DROP TABLE IF EXISTS faq;
DROP TABLE IF EXISTS notice;
DROP TABLE IF EXISTS qna;
DROP TABLE IF EXISTS board;

DROP TABLE IF EXISTS payment;

DROP TABLE IF EXISTS contract;

DROP TABLE IF EXISTS product;

DROP TABLE IF EXISTS banner;
DROP TABLE IF EXISTS company_info;

DROP TABLE IF EXISTS common_space;
DROP TABLE IF EXISTS rooms;

DROP TABLE IF EXISTS affiliate;

DROP TABLE IF EXISTS service_goods;
DROP TABLE IF EXISTS payment_method;

DROP TABLE IF EXISTS charge_status;
DROP TABLE IF EXISTS payment_status;

DROP TABLE IF EXISTS notice_category;
DROP TABLE IF EXISTS product_category;
DROP TABLE IF EXISTS board_category;

DROP TABLE IF EXISTS building;

DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


/* =========================================================
 * 1) CREATE (parent -> child) : 제약조건 포함, 순서로 FK 오류 방지
 * ========================================================= */

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    user_pwd VARCHAR(255) NOT NULL,
    user_birth DATE NOT NULL,
    user_tel VARCHAR(20) NOT NULL,
    user_role VARCHAR(20) NOT NULL DEFAULT 'host',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    user_status VARCHAR(20) NOT NULL DEFAULT 'active',
    delete_yn CHAR(1) DEFAULT 'N',

    UNIQUE KEY uq_users_email (user_email),
    UNIQUE KEY uq_users_tel (user_tel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE refresh_tokens (
    refresh_token_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,

    -- refresh token 원문 그대로 저장(간단/빠름). 보안 강화하려면 해시 저장으로 바꿔도 됨.
    token_value VARCHAR(512) NOT NULL,

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,

    -- 강제 로그아웃/폐기 처리
    revoked TINYINT(1) NOT NULL DEFAULT 0,
    revoked_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_refresh_token_value (token_value),
    KEY ix_refresh_tokens_user (user_id),
    KEY ix_refresh_tokens_expires (expires_at),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE building (
    building_id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(50) NOT NULL,
    building_address VARCHAR(500) NOT NULL,
    building_description VARCHAR(500),
    land_category VARCHAR(20),
    build_size DECIMAL(5,2),
    building_usage VARCHAR(20),
    exist_elv CHAR(1),
    parking_capacity INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE board_category (
    board_code VARCHAR(5) PRIMARY KEY,
    board_type VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product_category (
    prod_category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notice_category (
    notice_category_code VARCHAR(20) PRIMARY KEY,
    notice_category_name VARCHAR(50) NOT NULL,
    description VARCHAR(300),
    is_deletable CHAR(1) NOT NULL DEFAULT 'Y',
    is_active CHAR(1) NOT NULL DEFAULT 'Y'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_method (
  payment_method_id INT NOT NULL AUTO_INCREMENT COMMENT '결제수단ID',
  payment_method_name VARCHAR(50) NOT NULL COMMENT '결제수단이름(카카오페이, 토스 페이, N pay 등)',
  payment_method_code VARCHAR(20) NOT NULL COMMENT '코드(KAKAO, TOSS, SAMSUNG, NAVER, CARD 등)',
  is_active INT NOT NULL DEFAULT 1 COMMENT '활성화(1:활성, 0:비활성)',

  PRIMARY KEY (payment_method_id),
  UNIQUE KEY uq_payment_method_code (payment_method_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='결제 수단';

CREATE TABLE payment_status (
    status_code VARCHAR(20) NOT NULL,
    description VARCHAR(255) NULL,
    is_terminal INT NOT NULL DEFAULT 1,
    display_order INT NULL,
    is_active INT NOT NULL DEFAULT 1,
    PRIMARY KEY (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE charge_status (
    status_code VARCHAR(20) NOT NULL,
    description VARCHAR(255) NULL,
    is_terminal INT NOT NULL DEFAULT 1,
    display_order INT NULL,
    is_active INT NOT NULL DEFAULT 1,
    PRIMARY KEY (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE service_goods (
    service_goods_id INT AUTO_INCREMENT PRIMARY KEY,
    service_goods_name VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE banner (
    ban_id INT AUTO_INCREMENT PRIMARY KEY,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    ban_title VARCHAR(100) NOT NULL,
    ban_url VARCHAR(200),
    ban_order INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ban_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE company_info (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    ceo_name VARCHAR(50),
    business_no VARCHAR(50),
    company_tel VARCHAR(30),
    company_email VARCHAR(100),
    company_address VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_num INT NOT NULL,
    floor INT NOT NULL,
    room_size DECIMAL(5,2) NOT NULL,
    building_id INT NOT NULL,

    deposit DECIMAL(10,0),
    rent_price DECIMAL(10,0) NOT NULL,
    manage_fee DECIMAL(10,0),

    rent_type ENUM('monthly_rent', 'stay') DEFAULT 'monthly_rent',
    room_status VARCHAR(20) DEFAULT 'available',

    room_options VARCHAR(500),
    room_capacity INT DEFAULT 1,
    rent_min INT,
    sun_direction ENUM('n', 's', 'w', 'e'),
    room_description VARCHAR(3000),

    UNIQUE KEY uq_rooms_building_roomnum (building_id, room_num),

    CONSTRAINT fk_rooms_building
        FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE common_space (
    space_id INT AUTO_INCREMENT PRIMARY KEY,
    space_name VARCHAR(50) NOT NULL,
    building_id INT NOT NULL,
    space_capacity INT,
    space_floor INT NOT NULL,
    space_options VARCHAR(500),
    space_description VARCHAR(3000),

    CONSTRAINT fk_common_space_building
        FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE affiliate (
    affiliate_no INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    affiliate_name VARCHAR(50) NOT NULL,
    affiliate_head VARCHAR(50),
    affiliate_tel VARCHAR(30),
    business_no VARCHAR(50),
    affiliate_fax VARCHAR(30),
    affiliate_email VARCHAR(100),
    affiliate_address VARCHAR(500),
    affiliate_start_date DATETIME,
    affiliate_end_date DATETIME,
    affiliate_category VARCHAR(50),
    affiliate_description VARCHAR(3000),
    affiliate_status ENUM('planned', 'progress', 'ended'),

    CONSTRAINT fk_affiliate_building
        FOREIGN KEY (building_id) REFERENCES building(building_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE product (
    prod_id INT AUTO_INCREMENT PRIMARY KEY,
    prod_name VARCHAR(20) NOT NULL,
    prod_price DECIMAL(10,0) NOT NULL,
    prod_stock INT NOT NULL,
    prod_category_id INT NOT NULL,
    prod_desc VARCHAR(2000) NOT NULL,
    prod_status ENUM('on_sale', 'sold_out') DEFAULT 'on_sale',
    affiliate_id INT NOT NULL,

    CONSTRAINT fk_product_affiliate
        FOREIGN KEY (affiliate_id) REFERENCES affiliate(affiliate_no),
    CONSTRAINT fk_product_product_category
        FOREIGN KEY (prod_category_id) REFERENCES product_category(prod_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE board (
    board_id INT AUTO_INCREMENT PRIMARY KEY,
    board_title VARCHAR(300) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    board_content VARCHAR(3000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    read_count INT DEFAULT 0,
    board_code VARCHAR(5) NOT NULL,
    anonymity CHAR(1) DEFAULT 'N',
    importance CHAR(1) DEFAULT 'N',
    imp_end_date DATETIME,
    file_check CHAR(1) DEFAULT 'N',
    reply_check CHAR(1) DEFAULT 'N',

    CONSTRAINT fk_board_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE qna (
    qna_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT 0,
    qna_title VARCHAR(255) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    qna_status ENUM('waiting', 'complete') DEFAULT 'waiting',
    read_count INT DEFAULT 0,
    qna_content VARCHAR(4000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    board_code VARCHAR(5) NOT NULL,
    file_check CHAR(1) DEFAULT 'N',
    reply_check CHAR(1) DEFAULT 'N',
    is_privated CHAR(1) DEFAULT 'N',
    group_id INT,
    qna_depth INT DEFAULT 0,

    CONSTRAINT fk_qna_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_qna_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notice (
    notice_no INT AUTO_INCREMENT PRIMARY KEY,
    notice_title VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id VARCHAR(50) NOT NULL,
    notice_content VARCHAR(3000),
    importance CHAR(1) DEFAULT 'N',
    imp_end_date DATETIME,
    read_count INT NOT NULL DEFAULT 0,
    notice_category_code VARCHAR(20) NOT NULL,
    file_check CHAR(1) DEFAULT 'N',
    board_code VARCHAR(5) NOT NULL,

    CONSTRAINT fk_notice_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_notice_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code),
    CONSTRAINT fk_notice_category
        FOREIGN KEY (notice_category_code) REFERENCES notice_category(notice_category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE faq (
    faq_no INT AUTO_INCREMENT PRIMARY KEY,
    faq_title VARCHAR(100) NOT NULL,
    faq_content VARCHAR(3000) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    faq_status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    board_code VARCHAR(5) NOT NULL,

    CONSTRAINT fk_faq_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reply (
    reply_no INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    reply_comment VARCHAR(2000) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    parent_comment_id INT,
    reply_lev INT DEFAULT 1,
    reply_seq INT DEFAULT 1,

    CONSTRAINT fk_reply_board
        FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_parent
        FOREIGN KEY (parent_comment_id) REFERENCES reply(reply_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE board_likes (
    user_id VARCHAR(50) NOT NULL,
    board_id INT NOT NULL,

    PRIMARY KEY (user_id, board_id),

    CONSTRAINT fk_board_likes_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_board_likes_board
        FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reply_likes (
    user_id VARCHAR(50) NOT NULL,
    reply_no INT NOT NULL,

    PRIMARY KEY (user_id, reply_no),

    CONSTRAINT fk_reply_likes_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reply_likes_reply
        FOREIGN KEY (reply_no) REFERENCES reply(reply_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE complain (
    comp_id INT AUTO_INCREMENT PRIMARY KEY,
    comp_title VARCHAR(300) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    comp_content VARCHAR(3000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    comp_status ENUM('in_progress', 'resolved') NOT NULL DEFAULT 'in_progress',
    board_code VARCHAR(5) NOT NULL,
    file_check CHAR(1) DEFAULT 'N',
    reply_check CHAR(1) DEFAULT 'N',

    CONSTRAINT fk_complain_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_complain_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE cart (
    cart_num INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    prod_id INT NOT NULL,
    cart_quantity INT,
    cart_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_cart_user_product (user_id, prod_id),

    CONSTRAINT fk_cart_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product
        FOREIGN KEY (prod_id) REFERENCES product(prod_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contract (
    contract_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    contract_start DATE NOT NULL,
    contract_end DATE NOT NULL,
    deposit DECIMAL(10,0),
    rent_price DECIMAL(10,0) NOT NULL,
    manage_fee DECIMAL(10,0),
    payment_day INT NOT NULL,
    contract_status ENUM('requested', 'active', 'ended', 'cancelled') NOT NULL DEFAULT 'requested',
    sign_date DATETIME,
    movein_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    rent_type ENUM('monthly_rent', 'stay') DEFAULT 'monthly_rent',

    CONSTRAINT fk_contract_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_contract_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE residents (
    resident_num INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    contract_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,

    CONSTRAINT fk_residents_building
        FOREIGN KEY (building_id) REFERENCES building(building_id),
    CONSTRAINT fk_residents_contract
        FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    CONSTRAINT fk_residents_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment (
  payment_id INT NOT NULL AUTO_INCREMENT COMMENT '결제 아이디',
  user_id VARCHAR(50) NOT NULL COMMENT '결제한 사용자',
  service_goods_id INT NOT NULL COMMENT '결제 목적/청구 타입 (월세, 룸서비스, 상품)',
  currency CHAR(3) NOT NULL DEFAULT 'KRW' COMMENT '통화 코드',
  amount_total DECIMAL(12,0) NOT NULL COMMENT '주문 총액',
  amount_captured DECIMAL(12,0) NOT NULL DEFAULT 0 COMMENT '실제 승인 합계',
  payment_method_id INT NOT NULL DEFAULT 0 COMMENT '결제수단(KAKAOPAY/NAVERPAY)',
  provider VARCHAR(20) NOT NULL COMMENT 'PG(카카오,네이버,토스)',
  provider_payment_id VARCHAR(100) NULL COMMENT 'PG 결제 ID',
  provider_tid VARCHAR(100) NULL COMMENT '카카오 등 TID 트랜잭션 식별자',
  merchant_uid VARCHAR(100) NOT NULL COMMENT '우리 시스템 주문번호(결제 고유키)',
  tax_scope_amount DECIMAL(12,0) NULL COMMENT '과세 금액',
  tax_ex_scope_amount DECIMAL(12,0) NULL COMMENT '과세 제외 금액',
  tax_free_amount DECIMAL(12,0) NULL COMMENT '면세 금액',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'ready' COMMENT '결제 상태(ready, paid, cancelled)',
  paid_at DATETIME NULL COMMENT '결제 완료 시간',

  PRIMARY KEY (payment_id),

  KEY ix_payment_user (user_id),
  KEY ix_payment_provider (provider, provider_payment_id),
  KEY ix_payment_tid (provider, provider_tid),

  CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id),
  CONSTRAINT fk_payment_service_goods
    FOREIGN KEY (service_goods_id) REFERENCES service_goods(service_goods_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='결제 트랜젝션';

CREATE TABLE orders (
    order_no INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    order_status ENUM('ordered', 'paid', 'ended', 'cancelled') NOT NULL DEFAULT 'ordered',
    total_price INT NOT NULL DEFAULT 0,
    payment_id INT,
    order_created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_orders_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
    order_item_no INT AUTO_INCREMENT PRIMARY KEY,
    order_no INT NOT NULL,
    prod_id INT NOT NULL,
    order_quantity INT NOT NULL,
    order_price DECIMAL(10,0) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_no) REFERENCES orders(order_no),
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (prod_id) REFERENCES product(prod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE monthly_charge (
    charge_id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id INT NOT NULL,
    charge_type VARCHAR(30) NOT NULL,
    billing_month CHAR(7) NOT NULL,
    amount DECIMAL(10,0) NOT NULL,
    charge_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    payment_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_monthly_charge_contract
        FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
    CONSTRAINT fk_monthly_charge_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE room_service_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    total_amount DECIMAL(10,0) NOT NULL,
    order_status VARCHAR(20) NOT NULL DEFAULT 'requested',
    payment_id INT,
    room_service_description VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_room_service_order_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_room_service_order_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    CONSTRAINT fk_room_service_order_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    file_ref_type VARCHAR(50) NOT NULL,
    file_ref_id INT,
    file_path VARCHAR(1000) NOT NULL,
    origin_filename VARCHAR(260) NOT NULL,
    rename_filename VARCHAR(260) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delete_yn CHAR(1) DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    receiver_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50),
    message VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read CHAR(1) DEFAULT 'N',
    is_read_at DATETIME,
    target_id INT,
    target_type VARCHAR(50),
    url_path VARCHAR(260),

    CONSTRAINT fk_notification_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_sender
        FOREIGN KEY (sender_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    rating INT NOT NULL,
    review_title VARCHAR(100),
    review_comment VARCHAR(3000),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    board_code VARCHAR(5) NOT NULL,
    file_check CHAR(1) DEFAULT 'N',
    reply_check CHAR(1) DEFAULT 'N',

    UNIQUE KEY uq_review_user_room (user_id, room_id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_reviews_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    CONSTRAINT fk_reviews_board_category
        FOREIGN KEY (board_code) REFERENCES board_category(board_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE room_reservation (
    tour_id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    room_id INT NOT NULL,
    tour_start_date DATETIME NOT NULL,
    tour_end_date DATETIME NOT NULL,
    tour_name VARCHAR(50) NOT NULL,
    tour_tel VARCHAR(20) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tour_status ENUM('requested', 'confirmed', 'ended', 'cancelled') DEFAULT 'requested',
    tour_pwd VARCHAR(4),

    CONSTRAINT fk_room_reservation_building
        FOREIGN KEY (building_id) REFERENCES building(building_id),
    CONSTRAINT fk_room_reservation_room
        FOREIGN KEY (room_id) REFERENCES rooms(room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE space_reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    building_id INT NOT NULL,
    space_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    sr_start_time DATETIME NOT NULL,
    sr_end_time DATETIME NOT NULL,
    sr_num_people INT NOT NULL,

    CONSTRAINT uq_space_time UNIQUE (space_id, sr_start_time, sr_end_time),
    CONSTRAINT chk_space_time CHECK (sr_start_time < sr_end_time),

    CONSTRAINT fk_space_reservation_building
        FOREIGN KEY (building_id) REFERENCES building(building_id),
    CONSTRAINT fk_space_reservation_space
        FOREIGN KEY (space_id) REFERENCES common_space(space_id),
    CONSTRAINT fk_space_reservation_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_attempt (
    attempt_id INT NOT NULL AUTO_INCREMENT,
    payment_id INT NOT NULL,
    attempt_status ENUM('requested','approved','failed') NOT NULL DEFAULT 'failed',
    finished_at DATETIME NULL,

    PRIMARY KEY (attempt_id),

    CONSTRAINT fk_payment_attempt_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_refund (
    refund_id INT NOT NULL AUTO_INCREMENT,
    payment_id INT NOT NULL,
    refund_amount DECIMAL(12,0) NOT NULL,
    refund_status ENUM('requested','done','failed') NOT NULL,
    refund_reason VARCHAR(255) NULL,
    completed_at DATETIME NULL,

    PRIMARY KEY (refund_id),

    CONSTRAINT fk_payment_refund_payment
        FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
