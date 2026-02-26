/* =========================================================
 * Uni-Place : SAMPLE DATA (Parent → Child)
 * ========================================================= */


SET FOREIGN_KEY_CHECKS = 0;


/* 1) COMMON CODES */
INSERT INTO group_common_code (group_code, group_code_name, description, is_active) VALUES
('BOARD_CATEGORY',    '게시판분류',   '커뮤니티 게시글 분류', 1),
('PRODUCT_CATEGORY',  '상품분류',     '제휴사 상품 분류',     1),
('AFFILIATE_CATEGORY','제휴사분류',   '제휴사 카테고리',      1),
('NOTIFICATION',  ‘알림분류', '회원 알림 분류',  1);


INSERT INTO common_code (group_code, code, code_value, description, display_order, is_active) VALUES
('BOARD_CATEGORY',    'BOARD_FREE',   '자유게시판',  '자유글', 1, 1),
('BOARD_CATEGORY',    'BOARD_REVIEW',   '리뷰게시판',  '리뷰글', 2, 1),
('BOARD_CATEGORY',    'BOARD_NOTICE', '공지게시판',  '공지글', 3, 1),
('BOARD_CATEGORY',    'BOARD_QNA',   'QnA게시판',  'QnA', 4, 1),
('BOARD_CATEGORY',    'BOARD_FAQ',   'FAQ게시판',  ‘FAQ', 5, 1),
('BOARD_CATEGORY',    'BOARD_COMPLAIN',   '민원게시판',  '민원글', 6, 1),
('SUPPORT_CATEGORY',  'SUP_GENERAL',  '일반문의',    '일반',   1, 1),
('SUPPORT_CATEGORY',  'SUP_BILLING',  '결제문의',    '결제',   2, 1),
('PRODUCT_CATEGORY',  'PROD_FOOD',    '식음료',      '식음료', 1, 1),
('PRODUCT_CATEGORY',  'PROD_CLEAN',   '청소',        '청소',   2, 1),
('AFFILIATE_CATEGORY', 'AFF_FOOD',  '식음료제휴',  '식음료', 1, 1),
('AFFILIATE_CATEGORY', 'AFF_CLEAN',  '청소제휴',  '청소', 2, 1),
('AFFILIATE_CATEGORY', 'AFF_FRUNITURE',  '가구제휴',  '가구', 3, 1),
('NOTIFICATION', 'NOTI_LIKE',  '좋아요알림',  '좋아요', 1, 1),
('NOTIFICATION', 'NOTI_COMMENT',  'qna답변',  '답변', 2, 1),
('NOTIFICATION', 'NOTI_REPLY',  '댓글알림',  '댓글', 3, 1),
('NOTIFICATION', 'NOTI_PAY',  '결제알림',  '결제', 4, 1);


/* 2) USERS */
INSERT INTO users (user_id, user_nm, user_email, user_pwd, user_birth, user_tel, user_role, last_login_at, first_sign, user_st, delete_yn) VALUES
('admin1',  '관리자',  'admin1@uniplace.com',  '{bcrypt}dummy', '1990-01-01', '010-0000-0001', 'admin',  NOW(), 'Y', 'active', 'N'),
('user1',   '유저1',   'user1@uniplace.com',   '{bcrypt}dummy', '1998-03-12', '010-1111-1111', 'user',   NOW(), 'Y', 'active', 'N'),
('user2',   '유저2',   'user2@uniplace.com',   '{bcrypt}dummy', '1997-07-21', '010-2222-2222', 'user',   NOW(), 'Y', 'active', 'N'),
('tenant1', '입주자1', 'tenant1@uniplace.com', '{bcrypt}dummy', '1995-11-05', '010-3333-3333', 'tenant', NOW(), 'Y', 'active', 'N');


INSERT INTO refresh_tokens (refresh_token_id, user_id, token_hash, device_id, user_agent, ip, expires_at, revoked) VALUES
('11111111-1111-1111-1111-111111111111', 'user1',   'hash_user1_001',  'android-1', 'sample-agent', '127.0.0.1', DATE_ADD(NOW(), INTERVAL 30 DAY), 0),
('22222222-2222-2222-2222-222222222222', 'tenant1', 'hash_tenant_001', 'android-2', 'sample-agent', '127.0.0.1', DATE_ADD(NOW(), INTERVAL 30 DAY), 0);


INSERT INTO social_accounts (user_id, provider, provider_user_id, provider_email) VALUES
('user1', 'google', 'g-user1-001', 'user1@gmail.com');


/* 3) PROPERTY */
INSERT INTO building (building_id, building_nm, building_addr, building_desc, land_category, build_size, building_usage, exist_elv, parking_capacity) VALUES
(1, '유니플레이스 1관', '서울특별시 어딘가 123', '1관 설명', '상업', 123.45, '오피스', 'Y', 30),
(2, '유니플레이스 2관', '서울특별시 어딘가 456', '2관 설명', '상업',  98.10, '오피스', 'N', 10);


INSERT INTO rooms (room_id, room_no, floor, room_size, building_id, deposit, rent_price, manage_fee, rent_type, room_st, room_options, room_capacity, rent_min, sun_direction, room_desc, delete_yn) VALUES
(1, 101, 1, 12.50, 1, 1000000, 500000,  50000, 'monthly_rent', 'available', '에어컨,책상', 2, 1, 's', '101호 설명', 'N'),
(2, 202, 2, 18.00, 1, 2000000, 650000,  70000, 'monthly_rent', 'available', '침대,냉장고', 2, 1, 'e', '202호 설명', 'N'),
(3, 301, 3, 10.00, 2,  500000, 400000,  30000, 'stay',         'available', '샤워실',     1, 1, 'w', '301호 설명', 'N');


INSERT INTO common_space (space_id, space_nm, building_id, space_capacity, space_floor, space_options, space_desc) VALUES
(1, '회의실 A', 1, 10, 1, 'TV,화이트보드', '회의실 A 설명'),
(2, '라운지',   2, 20, 1, '커피머신',      '라운지 설명');


/* 4) FILES / COMPANY / BANNER */
INSERT INTO company_info (company_id, company_nm, company_ceo, business_no, company_tel, company_email, company_addr) VALUES
(1, '유니플레이스', '홍길동', '123-45-67890', '02-123-4567', 'help@uniplace.com', '서울특별시 본사로 1');


INSERT INTO banner (ban_id, start_at, end_at, ban_title, ban_url, ban_order, ban_st) VALUES
(1, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), '오픈 기념 이벤트', 'https://example.com/event', 1, 'active');


/* 5) AFFILIATE & PRODUCT */
INSERT INTO affiliate (affiliate_id, building_id, affiliate_nm, affiliate_ceo, affiliate_tel, business_no, affiliate_fax, affiliate_email, affiliate_addr, affiliate_start_at, affiliate_end_at, code, affiliate_desc, affiliate_st) VALUES
(1, 1, '유니카페', '김사장', '02-111-2222', '111-22-33333', '02-111-2223', 'cafe@uni.com', '서울 어딘가 카페로 1', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'AFF_FOOD', '건물 1관 카페 제휴', 'progress'),
(2, 2, '유니청소', '박대표', '02-333-4444', '444-55-66666',  NULL,          'clean@uni.com','서울 어딘가 청소로 2', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'AFF_FOOD', '건물 2관 청소 제휴', 'planned');


INSERT INTO product (prod_id, prod_nm, prod_price, prod_stock, code, prod_desc, prod_st, affiliate_id) VALUES
(1, '아메리카노',   4500, 100, 'PROD_FOOD',  '카페 아메리카노', 'on_sale', 1),
(2, '라떼',         5500,  80, 'PROD_FOOD',  '카페 라떼',       'on_sale', 1),
(3, '청소 서비스', 30000,  50, 'PROD_CLEAN', '1회 청소',        'on_sale', 2);


INSERT INTO files (file_parent_type, file_parent_id, file_path, origin_filename, rename_filename, file_size, file_type, delete_yn) VALUES
('product', 1, '/uploads/product/1/thumb.jpg', 'thumb.jpg', 'p1_thumb_001.jpg', 12345, 'image', 'N'),
('product', 3, '/uploads/product/3/thumb.jpg', 'thumb.jpg', 'p3_thumb_001.jpg', 22345, 'image', 'N');


/* 6) CONTRACT & RESIDENTS */
INSERT INTO contract (contract_id, user_id, room_id, contract_start, contract_end, deposit, rent_price, manage_fee, payment_day, contract_st, sign_at, movein_at, rent_type, lessor_nm, lessor_tel, lessor_addr, lessor_rrn, lessor_sign_file_id, contract_pdf_file_id) VALUES
(1, 'tenant1', 2, '2026-03-01', '2027-02-28', 2000000, 650000, 70000, 10, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'monthly_rent', '임대인김', '010-9999-9999', '서울특별시 임대인주소 1', '900101-1234567', NULL, NULL);


INSERT INTO residents (resident_id, building_id, contract_id, user_id) VALUES
(1, 1, 1, 'tenant1');


/* 7) RESERVATIONS */
INSERT INTO room_reservation (tour_id, building_id, room_id, tour_start_at, tour_end_at, tour_nm, tour_tel, tour_st, tour_pwd) VALUES
(1, 1, 1, '2026-03-02 10:00:00', '2026-03-02 10:30:00', '홍방문', '010-7777-7777', 'requested', '1234');


INSERT INTO space_reservations (reservation_id, building_id, space_id, user_id, sr_start_at, sr_end_at, sr_no_people, sr_st) VALUES
(1, 1, 1, 'user1', '2026-03-03 14:00:00', '2026-03-03 16:00:00', 6, 'confirmed');


/* 8) COMMUNITY */
INSERT INTO board (board_id, board_title, user_id, board_ctnt, read_count, code, anonymity, importance, imp_end_at, file_ck, reply_ck) VALUES
(1, '첫 글입니다', 'user1', '안녕하세요! 유니플레이스 커뮤니티 오픈!', 0, 'BOARD_FREE', 'N', 'N', NULL, 'Y', 'Y');


INSERT INTO reply (reply_id, board_id, user_id, reply_ctnt, parent_id, reply_lev, reply_seq) VALUES
(1, 1, 'user2', '축하합니다~', NULL, 1, 1),
(2, 1, 'user1', '감사합니다!', 1,   2, 1);


INSERT INTO board_likes (user_id, board_id) VALUES ('user2', 1);
INSERT INTO reply_likes (user_id, reply_id) VALUES ('user1', 1);


INSERT INTO files (file_parent_type, file_parent_id, file_path, origin_filename, rename_filename, file_size, file_type, delete_yn) VALUES
('board', 1, '/uploads/board/1/attach.png', 'attach.png', 'b1_001.png', 54321, 'image', 'N');


/* 9) SUPPORT */
INSERT INTO notice (notice_id, notice_title, user_id, notice_ctnt, importance, imp_end_at, read_count, notice_st, file_ck, code) VALUES
(1, '서비스 오픈 안내', 'admin1', '유니플레이스 서비스가 오픈했습니다.', 'Y', DATE_ADD(NOW(), INTERVAL 30 DAY), 0, 'notice', 'N', 'SUP_GENERAL');


INSERT INTO faq (faq_id, faq_title, faq_ctnt, is_active, code) VALUES
(1, '예약은 어떻게 하나요?', '예약 메뉴에서 날짜/시간을 선택해 진행하세요.', 1, 'SUP_GENERAL');


INSERT INTO qna (qna_id, parent_id, qna_title, user_id, qna_st, read_count, qna_ctnt, code, file_ck, reply_ck, group_id, qna_lev) VALUES
(1, NULL, '결제 영수증은 어디서 보나요?', 'user1',  'waiting',  0, '결제 내역에서 볼 수 있나요?',       'SUP_BILLING', 'N', 'Y', 1, 0),
(2, 1,    'Re: 결제 영수증',             'admin1', 'complete', 0, '결제 상세 화면에서 확인 가능합니다.', 'SUP_BILLING', 'N', 'N', 1, 1);


INSERT INTO complain (comp_id, comp_title, user_id, comp_ctnt, comp_st, code, file_ck, reply_ck) VALUES
(1, '방음이 아쉬워요', 'user1', '회의실 방음 개선 요청드립니다.', 'in_progress', 'SUP_GENERAL', 'N', 'N');


/* 10) REVIEWS */
INSERT INTO reviews (review_id, user_id, room_id, rating, review_title, review_ctnt, code, file_ck, reply_ck) VALUES
(1, 'tenant1', 2, 5, '만족합니다', '시설이 깔끔하고 관리가 좋아요.', 'SUP_GENERAL', 'N', 'N');


/* 11) NOTIFICATION */
INSERT INTO notification (notification_id, receiver_id, code, sender_id, message, is_read, target_id, target, url_path) VALUES
(1, 'user1', 'SUP_GENERAL', 'admin1', '공지사항이 등록되었습니다.', 'N', 1, 'notice', '/notices/1');


/* 12) CART */
INSERT INTO cart (cart_id, user_id) VALUES (1, 'user1');
INSERT INTO cart_items (cart_item_id, cart_id, prod_id, order_quantity, order_price) VALUES
(1, 1, 1, 2, 4500),
(2, 1, 3, 1, 30000);


/* 13) PAYMENT LOOKUP */
INSERT INTO payment_method (payment_method_id, payment_method_nm, payment_method_cd, is_active) VALUES
(1, '카드',     'CARD', 1),
(2, '계좌이체', 'BANK', 1);


INSERT INTO service_goods (service_goods_id, service_goods_cd, service_goods_nm, is_active, display_order) VALUES
(1, 'SHOP',  '쇼핑', 1, 1),
(2, 'MONTH', '월세', 1, 2);


INSERT INTO payment_status (status_cd, `description`, is_terminal, display_order, is_active) VALUES
('ready', '결제 대기', 0, 1, 1),
('paid',  '결제 완료', 1, 2, 1),
('fail',  '결제 실패', 1, 3, 1);


INSERT INTO charge_status (status_cd, `description`, is_terminal, display_order, is_active) VALUES
('unpaid', '미납', 0, 1, 1),
('paid',   '납부', 1, 2, 1);


/* 14) PAYMENT & ORDERS */
INSERT INTO payment (payment_id, user_id, service_goods_id, target_type, target_id, currency, total_price, captured_price, payment_method_id, provider, provider_payment_id, merchant_uid, idempotency_key, tax_scope_price, tax_ex_scope_price, tax_free_price, payment_st, paid_at) VALUES
(1, 'user1', 1, 'order', 1, 'KRW', 39000, 39000, 1, 'iamport', 'imp_001', 'muid_order_001', 'idem_user1_001', 39000, 0, 0, 'paid', NOW());


INSERT INTO orders (order_id, user_id, order_st, total_price, payment_id, order_created_at) VALUES
(1, 'user1', 'paid', 39000, 1, NOW());


INSERT INTO order_items (order_item_id, order_id, prod_id, order_quantity, order_price) VALUES
(1, 1, 1, 2, 4500),
(2, 1, 3, 1, 30000);


INSERT INTO room_service_order (order_id, parent_order_id, user_id, room_id, total_price, order_st, room_service_desc) VALUES
(1, 1, 'tenant1', 2, 30000, 'paid', '청소 서비스 요청');


INSERT INTO payment (payment_id, user_id, service_goods_id, target_type, target_id, currency, total_price, captured_price, payment_method_id, provider, provider_payment_id, merchant_uid, idempotency_key, payment_st, paid_at) VALUES
(2, 'tenant1', 2, 'monthly_charge', 1, 'KRW', 720000, 720000, 2, 'kakao', 'kakao_001', 'muid_month_001', 'idem_tenant1_001', 'paid', NOW());


INSERT INTO monthly_charge (charge_id, contract_id, charge_type, billing_dt, price, charge_st, payment_id) VALUES
(1, 1, 'rent', '2026-03', 720000, 'paid', 2);


INSERT INTO payment_attempt (attempt_id, payment_id, attempt_st, finished_at) VALUES
(1, 1, 'approved', NOW()),
(2, 2, 'approved', NOW());


INSERT INTO payment_refund (refund_id, payment_id, refund_price, refund_st, refund_reason, completed_at) VALUES
(1, 1, 0, 'done', '샘플(환불 없음)', NOW());


INSERT INTO payment_intent (payment_intent_id, payment_id, provider, intent_st, provider_ref_id, app_scheme_url, return_url, returned_params_json, pg_ready_json, pg_approve_json) VALUES
(1, 1, 'iamport', 'APPROVE_OK', 'pref_001', 'uniplace://pay', 'https://example.com/return',
 JSON_OBJECT('foo','bar'), JSON_OBJECT('ready',true), JSON_OBJECT('approved',true));


SET FOREIGN_KEY_CHECKS = 1;

