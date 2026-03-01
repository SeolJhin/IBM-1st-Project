/* =========================================================
 * Uni-Place sample data (broad scenario seed) - V2
 * - buildings 1~8
 * - floors 1~15, 20 rooms per floor auto-generate (missing only)
 * - V2: product_building_stock + cart_items.building_id + order_items.building_id
 * - Extra: REVIEW_CATEGORY + extra products(6~17) + extra reviews
 * - Password for seeded users: 12345678
 * - BCrypt hash: $2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze
 * ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;

-- =========================================================
-- cleanup (child -> parent)
-- =========================================================
DELETE FROM payment_intent;
DELETE FROM payment_refund;
DELETE FROM payment_attempt;
DELETE FROM monthly_charge;
DELETE FROM room_service_order;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM payment;

DELETE FROM charge_status;
DELETE FROM payment_status;
DELETE FROM service_goods;
DELETE FROM payment_method;

DELETE FROM cart_items;
DELETE FROM cart;

DELETE FROM notification;
DELETE FROM reviews;
DELETE FROM complain;
DELETE FROM qna;
DELETE FROM faq;
DELETE FROM notice;

DELETE FROM reply_likes;
DELETE FROM board_likes;
DELETE FROM reply;
DELETE FROM board;

DELETE FROM space_reservations;
DELETE FROM room_reservation;

DELETE FROM residents;
DELETE FROM contract;

DELETE FROM files;

DELETE FROM product_building_stock;
DELETE FROM product;

DELETE FROM affiliate;
DELETE FROM banner;
DELETE FROM company_info;
DELETE FROM common_space;
DELETE FROM rooms;
DELETE FROM building;

DELETE FROM social_accounts;
DELETE FROM refresh_tokens;
DELETE FROM users;

DELETE FROM common_code;
DELETE FROM group_common_code;

/* =========================================================
 * Uni-Place sample data (broad scenario seed) - V2
 * - buildings 1~8
 * - floors 1~15, 20 rooms per floor auto-generate (missing only)
 * - V2: product_building_stock + cart_items.building_id + order_items.building_id
 * - Extra: REVIEW_CATEGORY + extra products(6~17) + extra reviews
 * - Password for seeded users: 12345678
 * - BCrypt hash: $2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze
 * ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES = 0;


-- =========================================================
-- 1) common codes
-- =========================================================
INSERT INTO group_common_code (group_code, group_code_name, description, is_active) VALUES
('BOARD_CATEGORY', 'Board Category', 'Community board category', 1),
('SUPPORT_CATEGORY', 'Support Category', 'Support category', 1),
('PRODUCT_CATEGORY', 'Product Category', 'Commerce product category', 1),
('AFFILIATE_CATEGORY', 'Affiliate Category', 'Affiliate category', 1),
('NOTIFICATION', 'Notification Category', 'Notification category', 1);

INSERT INTO common_code (group_code, code, code_value, description, display_order, is_active) VALUES
('BOARD_CATEGORY', 'BOARD_FREE',   'Free',        'Free board', 1, 1),
('BOARD_CATEGORY', 'BOARD_REVIEW', 'Review',      'Review board', 2, 1),
('BOARD_CATEGORY', 'BOARD_NOTICE', 'Notice',      'Notice board', 3, 1),
('SUPPORT_CATEGORY', 'SUP_GENERAL','General',     'General support', 1, 1),
('SUPPORT_CATEGORY', 'SUP_BILLING','Billing',     'Billing support', 2, 1),
('PRODUCT_CATEGORY', 'PROD_FOOD',  'Food',        'Food product', 1, 1),
('PRODUCT_CATEGORY', 'PROD_CLEAN', 'Cleaning',    'Cleaning product', 2, 1),
('AFFILIATE_CATEGORY', 'AFF_FOOD', 'Food partner','Food affiliate', 1, 1),
('AFFILIATE_CATEGORY', 'AFF_CLEAN','Clean partner','Clean affiliate', 2, 1),
('NOTIFICATION', 'NOTI_PAY',       'Payment',     'Payment notification', 1, 1),
('NOTIFICATION', 'NOTI_NOTICE',    'Notice',      'Notice notification', 2, 1);

-- =========================================================
-- 2) users (jinung/hyun/jungbin/juyong + user1~user50)
-- =========================================================
INSERT INTO users
(user_id, user_nm, user_email, user_pwd, user_birth, user_tel, user_role, last_login_at, first_sign, user_st, delete_yn)
VALUES
('jinung1',  'jinung1',  'jinung1@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1995-01-01', '010-2000-0001', 'user',  NOW(), 'N', 'active', 'N'),
('jinung2',  'jinung2',  'jinung2@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1994-01-01', '010-2000-0002', 'admin', NOW(), 'N', 'active', 'N'),
('hyunhi1',  'hyunhi1',  'hyunhi1@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1995-02-01', '010-2000-0003', 'user',  NOW(), 'N', 'active', 'N'),
('hyunji2',  'hyunji2',  'hyunji2@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1994-02-01', '010-2000-0004', 'admin', NOW(), 'N', 'active', 'N'),
('jungbin1', 'jungbin1', 'jungbin1@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1995-03-01', '010-2000-0005', 'user',  NOW(), 'N', 'active', 'N'),
('jungbin2', 'jungbin2', 'jungbin2@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1994-03-01', '010-2000-0006', 'admin', NOW(), 'N', 'active', 'N'),
('juyong1',  'juyong1',  'juyong1@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1995-04-01', '010-2000-0007', 'user',  NOW(), 'N', 'active', 'N'),
('juyong2',  'juyong2',  'juyong2@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1994-04-01', '010-2000-0008', 'admin', NOW(), 'N', 'active', 'N'),

('user1',  'user1',  'user1@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-01', '010-2100-0001', 'user', NOW(), 'N', 'active', 'N'),
('user2',  'user2',  'user2@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-02', '010-2100-0002', 'user', NOW(), 'N', 'active', 'N'),
('user3',  'user3',  'user3@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-03', '010-2100-0003', 'user', NOW(), 'N', 'active', 'N'),
('user4',  'user4',  'user4@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-04', '010-2100-0004', 'user', NOW(), 'N', 'active', 'N'),
('user5',  'user5',  'user5@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-05', '010-2100-0005', 'user', NOW(), 'N', 'active', 'N'),
('user6',  'user6',  'user6@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-06', '010-2100-0006', 'user', NOW(), 'N', 'active', 'N'),
('user7',  'user7',  'user7@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-07', '010-2100-0007', 'user', NOW(), 'N', 'active', 'N'),
('user8',  'user8',  'user8@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-08', '010-2100-0008', 'user', NOW(), 'N', 'active', 'N'),
('user9',  'user9',  'user9@uniplace.com',  '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-09', '010-2100-0009', 'user', NOW(), 'N', 'active', 'N'),
('user10', 'user10', 'user10@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-10', '010-2100-0010', 'user', NOW(), 'N', 'active', 'N'),
('user11', 'user11', 'user11@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-11', '010-2100-0011', 'user', NOW(), 'N', 'active', 'N'),
('user12', 'user12', 'user12@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-12', '010-2100-0012', 'user', NOW(), 'N', 'active', 'N'),
('user13', 'user13', 'user13@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-13', '010-2100-0013', 'user', NOW(), 'N', 'active', 'N'),
('user14', 'user14', 'user14@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-14', '010-2100-0014', 'user', NOW(), 'N', 'active', 'N'),
('user15', 'user15', 'user15@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-15', '010-2100-0015', 'user', NOW(), 'N', 'active', 'N'),
('user16', 'user16', 'user16@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-16', '010-2100-0016', 'user', NOW(), 'N', 'active', 'N'),
('user17', 'user17', 'user17@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-17', '010-2100-0017', 'user', NOW(), 'N', 'active', 'N'),
('user18', 'user18', 'user18@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-18', '010-2100-0018', 'user', NOW(), 'N', 'active', 'N'),
('user19', 'user19', 'user19@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-19', '010-2100-0019', 'user', NOW(), 'N', 'active', 'N'),
('user20', 'user20', 'user20@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-20', '010-2100-0020', 'user', NOW(), 'N', 'active', 'N'),
('user21', 'user21', 'user21@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-21', '010-2100-0021', 'user', NOW(), 'N', 'active', 'N'),
('user22', 'user22', 'user22@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-22', '010-2100-0022', 'user', NOW(), 'N', 'active', 'N'),
('user23', 'user23', 'user23@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-23', '010-2100-0023', 'user', NOW(), 'N', 'active', 'N'),
('user24', 'user24', 'user24@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-24', '010-2100-0024', 'user', NOW(), 'N', 'active', 'N'),
('user25', 'user25', 'user25@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-25', '010-2100-0025', 'user', NOW(), 'N', 'active', 'N'),
('user26', 'user26', 'user26@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-26', '010-2100-0026', 'user', NOW(), 'N', 'active', 'N'),
('user27', 'user27', 'user27@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-27', '010-2100-0027', 'user', NOW(), 'N', 'active', 'N'),
('user28', 'user28', 'user28@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-28', '010-2100-0028', 'user', NOW(), 'N', 'active', 'N'),
('user29', 'user29', 'user29@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-29', '010-2100-0029', 'user', NOW(), 'N', 'active', 'N'),
('user30', 'user30', 'user30@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-30', '010-2100-0030', 'user', NOW(), 'N', 'active', 'N'),
('user31', 'user31', 'user31@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-01-31', '010-2100-0031', 'user', NOW(), 'N', 'active', 'N'),
('user32', 'user32', 'user32@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-01', '010-2100-0032', 'user', NOW(), 'N', 'active', 'N'),
('user33', 'user33', 'user33@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-02', '010-2100-0033', 'user', NOW(), 'N', 'active', 'N'),
('user34', 'user34', 'user34@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-03', '010-2100-0034', 'user', NOW(), 'N', 'active', 'N'),
('user35', 'user35', 'user35@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-04', '010-2100-0035', 'user', NOW(), 'N', 'active', 'N'),
('user36', 'user36', 'user36@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-05', '010-2100-0036', 'user', NOW(), 'N', 'active', 'N'),
('user37', 'user37', 'user37@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-06', '010-2100-0037', 'user', NOW(), 'N', 'active', 'N'),
('user38', 'user38', 'user38@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-07', '010-2100-0038', 'user', NOW(), 'N', 'active', 'N'),
('user39', 'user39', 'user39@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-08', '010-2100-0039', 'user', NOW(), 'N', 'active', 'N'),
('user40', 'user40', 'user40@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-09', '010-2100-0040', 'user', NOW(), 'N', 'active', 'N'),
('user41', 'user41', 'user41@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-10', '010-2100-0041', 'user', NOW(), 'N', 'active', 'N'),
('user42', 'user42', 'user42@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-11', '010-2100-0042', 'user', NOW(), 'N', 'active', 'N'),
('user43', 'user43', 'user43@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-12', '010-2100-0043', 'user', NOW(), 'N', 'active', 'N'),
('user44', 'user44', 'user44@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-13', '010-2100-0044', 'user', NOW(), 'N', 'active', 'N'),
('user45', 'user45', 'user45@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-14', '010-2100-0045', 'user', NOW(), 'N', 'active', 'N'),
('user46', 'user46', 'user46@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-15', '010-2100-0046', 'user', NOW(), 'N', 'active', 'N'),
('user47', 'user47', 'user47@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-16', '010-2100-0047', 'user', NOW(), 'N', 'active', 'N'),
('user48', 'user48', 'user48@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-17', '010-2100-0048', 'user', NOW(), 'N', 'active', 'N'),
('user49', 'user49', 'user49@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-18', '010-2100-0049', 'user', NOW(), 'N', 'active', 'N'),
('user50', 'user50', 'user50@uniplace.com', '$2a$10$nxe1a6fq5oK/h/MgRys/EO0KOwv87wpc.ETAYS40Zx5eHNZOX0oze', '1996-02-19', '010-2100-0050', 'user', NOW(), 'N', 'active', 'N');

-- =========================================================
-- 3) auth-related child tables
-- =========================================================
INSERT INTO refresh_tokens
(refresh_token_id, user_id, token_hash, device_id, user_agent, ip, issued_at, expires_at, revoked, revoked_at, last_used_at)
VALUES
('rtk-0001-0001-0001-000000000001','jinung2','hash_a1','WEB-admin-1','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),0,NULL,NOW()),
('rtk-0001-0001-0001-000000000002','hyunji2','hash_a2','WEB-admin-2','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),0,NULL,NOW()),
('rtk-0001-0001-0001-000000000003','user1','hash_u1','WEB-user-1','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),0,NULL,NOW()),
('rtk-0001-0001-0001-000000000004','user2','hash_u2','WEB-user-2','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),0,NULL,NOW()),
('rtk-0001-0001-0001-000000000005','user3','hash_u3','WEB-user-3','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),0,NULL,NOW()),
('rtk-0001-0001-0001-000000000006','user10','hash_u10','WEB-user-10','Chrome/134','127.0.0.1',NOW(),DATE_ADD(NOW(), INTERVAL 30 DAY),1,NOW(),NOW());

INSERT INTO social_accounts (social_account_id, user_id, provider, provider_user_id, provider_email)
VALUES
(1, 'user1', 'google', 'google-user1', 'user1@gmail.com'),
(2, 'user4', 'kakao',  'kakao-user4',  'user4@kakao.com'),
(3, 'user9', 'naver',  'naver-user9',  'user9@naver.com');

-- =========================================================
-- 4) property/system/file (buildings 1~8)
-- =========================================================
INSERT INTO building (building_id, building_nm, building_addr, building_desc, land_category, build_size, building_usage, exist_elv, parking_capacity, building_lessor_nm, building_lessor_tel, building_lessor_addr, building_lessor_rrn, delete_yn) VALUES
(1, 'Uniplace A', 'Seoul A-ro 101', 'Main building A', 'commercial', 123.45, 'residence', 'Y', 45, '김건물', '010-9000-0001', '서울시 강남구 테헤란로 101', '650101-1234567', 'N'),
(2, 'Uniplace B', 'Seoul B-ro 202', 'Main building B', 'commercial',  98.10, 'residence', 'Y', 20, '이부동산', '010-9000-0002', '서울시 서초구 서초대로 202', '670202-1234567', 'N'),
(3, 'Uniplace C', 'Seoul C-ro 303', 'Main building C', 'commercial',  88.80, 'mixed',     'N', 12, '박임대', '010-9000-0003', '서울시 마포구 마포대로 303', '690303-1234567', 'N');

/* base rooms (keep original 6) */
INSERT INTO rooms
(room_id, room_no, floor, room_size, building_id, deposit, rent_price, manage_fee, rent_type, room_st, room_options, room_capacity, rent_min, sun_direction, room_desc, delete_yn)
VALUES
(1, 101, 1, 12.50, 1, 1000000, 500000, 50000, 'monthly_rent', 'available',  'desk,aircon',        1, 1, 's', 'A-101', 'N'),
(2, 102, 1, 14.20, 1, 1200000, 550000, 50000, 'monthly_rent', 'contracted', 'desk,closet',        1, 1, 'e', 'A-102', 'N'),
(3, 201, 2, 16.00, 1, 1500000, 620000, 60000, 'monthly_rent', 'contracted', 'desk,aircon,closet', 2, 1, 's', 'A-201', 'N'),
(4, 301, 3, 10.00, 2,  800000, 420000, 40000, 'stay',         'available',  'single-bed',         1, 1, 'w', 'B-301', 'N'),
(5, 401, 4, 18.50, 2, 2000000, 700000, 70000, 'monthly_rent', 'reserved',   'double-bed',         2, 1, 'n', 'B-401', 'N'),
(6, 501, 5, 20.00, 3, 2500000, 850000, 80000, 'monthly_rent', 'repair',     'suite',              2, 1, 'e', 'C-501', 'N');

/* auto-generate missing rooms:
   each building has floors 1~15, each floor has 20 rooms */
DROP TEMPORARY TABLE IF EXISTS tmp_floor15;
CREATE TEMPORARY TABLE tmp_floor15 (floor_no INT PRIMARY KEY);

INSERT INTO tmp_floor15 (floor_no)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 15
)
SELECT n FROM seq;

DROP TEMPORARY TABLE IF EXISTS tmp_unit20;
CREATE TEMPORARY TABLE tmp_unit20 (unit_no INT PRIMARY KEY);

INSERT INTO tmp_unit20 (unit_no)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 20
)
SELECT n FROM seq;

INSERT INTO rooms
(room_no, floor, room_size, building_id, deposit, rent_price, manage_fee, rent_type, room_st, room_options, room_capacity, rent_min, sun_direction, room_desc, delete_yn)
SELECT
  (f.floor_no * 100) + u.unit_no AS room_no,
  f.floor_no AS floor,
  12.00 + (u.unit_no * 0.35) AS room_size,
  b.building_id,
  1000000 + (f.floor_no * 30000) + (u.unit_no * 20000) AS deposit,
  450000 + (f.floor_no * 10000) + (u.unit_no * 3000) AS rent_price,
  50000 + (u.unit_no * 1000) AS manage_fee,
  CASE WHEN u.unit_no % 6 = 0 THEN 'stay' ELSE 'monthly_rent' END AS rent_type,
  'available' AS room_st,
  CONCAT('desk,aircon,option-', f.floor_no, '-', u.unit_no) AS room_options,
  CASE WHEN u.unit_no % 4 = 0 THEN 2 ELSE 1 END AS room_capacity,
  1 + (u.unit_no % 6) AS rent_min,
  CASE (u.unit_no % 4) WHEN 0 THEN 'n' WHEN 1 THEN 's' WHEN 2 THEN 'e' ELSE 'w' END AS sun_direction,
  CONCAT('Auto generated room ', b.building_id, '-', f.floor_no, '-', u.unit_no) AS room_desc,
  'N' AS delete_yn
FROM building b
CROSS JOIN tmp_floor15 f
CROSS JOIN tmp_unit20 u
WHERE b.building_id BETWEEN 1 AND 8
  AND NOT EXISTS (
    SELECT 1
    FROM rooms r
    WHERE r.building_id = b.building_id
      AND r.room_no = (f.floor_no * 100) + u.unit_no
  );

DROP TEMPORARY TABLE IF EXISTS tmp_floor15;
DROP TEMPORARY TABLE IF EXISTS tmp_unit20;

INSERT INTO common_space (space_id, space_nm, building_id, space_capacity, space_floor, space_options, space_desc) VALUES
(1, 'Meeting Room A', 1,  8, 1, 'tv,whiteboard', 'Meeting room A'),
(2, 'Lounge A',       1, 20, 1, 'coffee,sofa',   'Lounge A'),
(3, 'Meeting Room B', 2, 10, 2, 'tv',            'Meeting room B'),
(4, 'Gym C',          3, 15, 1, 'fitness',       'Gym C');

INSERT INTO company_info (company_id, company_nm, company_ceo, business_no, company_tel, company_email, company_addr)
VALUES
(1, 'Uniplace Inc', 'CEO Kim', '123-45-67890', '02-111-2222', 'help@uniplace.com', 'Seoul HQ 1');

INSERT INTO banner (ban_id, start_at, end_at, ban_title, ban_url, ban_order, ban_st) VALUES
(1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'Spring Event',  'https://example.com/banner1', 1, 'active'),
(2, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 'Move-in Promo', 'https://example.com/banner2', 2, 'active');

INSERT INTO affiliate
(affiliate_id, building_id, affiliate_nm, affiliate_ceo, affiliate_tel, business_no, affiliate_fax, affiliate_email, affiliate_addr, affiliate_start_at, affiliate_end_at, code, affiliate_desc, affiliate_st)
VALUES
(1, 1, 'Uni Cafe',     'Park', '02-333-4444', '111-22-33333', '02-333-4445', 'cafe@uniplace.com',  'Seoul A-ro 101', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'AFF_FOOD',  'Building A cafe',     'progress'),
(2, 2, 'Uni Cleaning', 'Lee',  '02-555-6666', '222-33-44444', NULL,          'clean@uniplace.com', 'Seoul B-ro 202', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'AFF_CLEAN', 'Building B cleaning', 'planned');

-- =========================================================
-- 4-2) product + product_building_stock (V2)
-- =========================================================
/* base product 1~5 */
INSERT INTO product (prod_id, prod_nm, prod_price, prod_stock, code, prod_desc, prod_st, affiliate_id) VALUES
(1, 'Americano',       4500,  100, 'PROD_FOOD',  'Coffee',            'on_sale', 1),
(2, 'Latte',           5500,   80, 'PROD_FOOD',  'Milk coffee',       'on_sale', 1),
(3, 'Sandwich',        7000,   60, 'PROD_FOOD',  'Simple sandwich',   'on_sale', 1),
(4, 'Room Cleaning',  30000,   50, 'PROD_CLEAN', 'One-time cleaning', 'on_sale', 2),
(5, 'Laundry Service',20000,   40, 'PROD_CLEAN', 'Laundry package',   'sold_out',2);

/* V2: building별 재고 (base) */
INSERT INTO product_building_stock (prod_id, building_id, stock) VALUES
(1, 1, 50), (1, 2, 30),
(2, 1, 20), (2, 2, 15),
(3, 1, 10), (3, 2, 40),
(4, 1, 25), (4, 2, 25),
(5, 1,  5), (5, 2, 60);

INSERT INTO files (file_id, file_parent_type, file_parent_id, file_path, origin_filename, rename_filename, file_size, file_type, delete_yn) VALUES
(1, 'product', 1, '/uploads/product/1/thumb.jpg', 'thumb.jpg', 'prod1_thumb.jpg', 12000, 'image', 'N'),
(2, 'product', 4, '/uploads/product/4/thumb.jpg', 'thumb.jpg', 'prod4_thumb.jpg', 14000, 'image', 'N'),
(3, 'board',   1, '/uploads/board/1/file.png',    'file.png',  'board1_file.png', 25000, 'image', 'N'),
(4, 'notice',  1, '/uploads/notice/1/file.pdf',   'notice.pdf','notice1.pdf',     34000, 'pdf',   'N');

-- =========================================================
-- 5) contract/resident
-- =========================================================
INSERT INTO contract
(contract_id, user_id, room_id, contract_start, contract_end, deposit, rent_price, manage_fee, payment_day, contract_st, sign_at, movein_at, rent_type, lessor_nm, lessor_tel, lessor_addr, lessor_rrn, lessor_sign_file_id, contract_pdf_file_id)
VALUES
(1, 'user1', 2, '2026-01-01', '2026-12-31', 1200000, 550000, 50000, 10, 'active',    NOW(), NOW(),  'monthly_rent', 'Lessor A', '010-8000-0001', 'Seoul A', '900101-1234567', NULL, NULL),
(2, 'user2', 3, '2026-02-01', '2027-01-31', 1500000, 620000, 60000, 10, 'active',    NOW(), NOW(),  'monthly_rent', 'Lessor B', '010-8000-0002', 'Seoul A', '900102-1234567', NULL, NULL),
(3, 'user3', 5, '2026-03-01', '2027-02-28', 2000000, 700000, 70000, 12, 'requested', NOW(), NULL,   'monthly_rent', 'Lessor C', '010-8000-0003', 'Seoul B', '900103-1234567', NULL, NULL),
(4, 'user4', 4, '2026-01-15', '2026-07-14',  800000, 420000, 40000,  5, 'active',    NOW(), NOW(),  'stay',         'Lessor D', '010-8000-0004', 'Seoul B', '900104-1234567', NULL, NULL),
(5, 'user5', 1, '2026-04-01', '2027-03-31', 1000000, 500000, 50000, 15, 'requested', NOW(), NULL,   'monthly_rent', 'Lessor E', '010-8000-0005', 'Seoul A', '900105-1234567', NULL, NULL),
(6, 'user6', 6, '2025-01-01', '2025-12-31', 2500000, 850000, 80000, 20, 'ended',     NOW(), NOW(),  'monthly_rent', 'Lessor F', '010-8000-0006', 'Seoul C', '900106-1234567', NULL, NULL);

INSERT INTO residents (resident_id, building_id, contract_id, user_id) VALUES
(1, 1, 1, 'user1'),
(2, 1, 2, 'user2'),
(3, 2, 4, 'user4');

-- =========================================================
-- 6) reservations
-- =========================================================
INSERT INTO room_reservation
(tour_id, building_id, room_id, tour_start_at, tour_end_at, tour_nm, tour_tel, tour_st, tour_pwd)
VALUES
(1, 1, 1, '2026-03-10 10:00:00', '2026-03-10 10:30:00', 'Kim Guest',  '010-7000-0001', 'requested', '1234'),
(2, 1, 3, '2026-03-11 14:00:00', '2026-03-11 14:30:00', 'Lee Guest',  '010-7000-0002', 'confirmed', '2345'),
(3, 2, 4, '2026-03-12 16:00:00', '2026-03-12 16:30:00', 'Park Guest', '010-7000-0003', 'ended',     '3456'),
(4, 3, 6, '2026-03-13 11:00:00', '2026-03-13 11:30:00', 'Choi Guest', '010-7000-0004', 'cancelled', '4567');

INSERT INTO space_reservations
(reservation_id, building_id, space_id, user_id, sr_start_at, sr_end_at, sr_no_people, sr_st)
VALUES
(1, 1, 1, 'user7',  '2026-03-15 09:00:00', '2026-03-15 11:00:00', 4, 'requested'),
(2, 1, 2, 'user8',  '2026-03-16 19:00:00', '2026-03-16 21:00:00', 8, 'confirmed'),
(3, 2, 3, 'user9',  '2026-03-17 13:00:00', '2026-03-17 14:00:00', 3, 'ended'),
(4, 3, 4, 'user10', '2026-03-18 07:00:00', '2026-03-18 08:00:00', 2, 'cancelled');

-- =========================================================
-- 7) community
-- =========================================================
INSERT INTO board
(board_id, board_title, user_id, board_ctnt, read_count, code, anonymity, importance, imp_end_at, file_ck, reply_ck)
VALUES
(1, 'Move-in tips',       'user9',   'Please share your move-in tips.', 12, 'BOARD_FREE',   'N', 'N', NULL, 'Y', 'Y'),
(2, 'Room review A-201',  'user10',  'A-201 was good for me.',           9, 'BOARD_REVIEW', 'N', 'N', NULL, 'N', 'Y'),
(3, 'Community notice',   'jinung2', 'Maintenance schedule posted.',    30, 'BOARD_NOTICE', 'N', 'Y', DATE_ADD(NOW(), INTERVAL 7 DAY), 'N', 'N');

INSERT INTO reply (reply_id, board_id, user_id, reply_ctnt, parent_id, reply_lev, reply_seq) VALUES
(1, 1, 'user11', 'Tip: reserve elevator in advance.', NULL, 1, 1),
(2, 1, 'user12', 'Thanks for sharing.',               1,    2, 1),
(3, 2, 'user13', 'Agree, nice room.',                 NULL, 1, 1);

INSERT INTO board_likes (user_id, board_id) VALUES
('user11', 1), ('user12', 1), ('user13', 2), ('user14', 3);

INSERT INTO reply_likes (user_id, reply_id) VALUES
('user9', 1), ('user10', 1), ('user11', 3);

-- =========================================================
-- 8) support/review/notification
-- =========================================================
INSERT INTO notice
(notice_id, notice_title, user_id, notice_ctnt, importance, imp_end_at, read_count, notice_st, file_ck, code)
VALUES
(1, 'Service launch guide', 'hyunji2',  'Welcome to Uniplace.',           'Y', DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 'notice',    'Y', 'SUP_GENERAL'),
(2, 'Billing maintenance',  'jungbin2', 'Billing batch may be delayed.',  'N', NULL,                              45, 'operation', 'N', 'SUP_BILLING');

INSERT INTO faq (faq_id, faq_title, faq_ctnt, is_active, code) VALUES
(1, 'How to reserve space?', 'Go to reservation menu and choose slot.', 1, 'SUP_GENERAL'),
(2, 'How to check payment?', 'Go to my payment list.',                  1, 'SUP_BILLING');

INSERT INTO qna
(qna_id, parent_id, qna_title, user_id, qna_st, read_count, qna_ctnt, code, file_ck, reply_ck, group_id, qna_lev)
VALUES
(1, NULL, 'Payment receipt issue',       'user14',  'waiting',  0, 'Where can I download receipt?',              'SUP_BILLING', 'N', 'Y', 1, 0),
(2, 1,    'Re: Payment receipt issue',   'jinung2', 'complete', 0, 'You can download in payment detail page.',  'SUP_BILLING', 'N', 'N', 1, 1),
(3, NULL, 'Move-in process question',    'user15',  'complete', 2, 'What documents are required?',              'SUP_GENERAL', 'N', 'Y', 2, 0),
(4, 3,    'Re: Move-in process question','hyunji2', 'complete', 0, 'ID card and contract copy are needed.',     'SUP_GENERAL', 'N', 'N', 2, 1);

INSERT INTO complain (comp_id, comp_title, user_id, comp_ctnt, comp_st, code, file_ck, reply_ck) VALUES
(1, 'Noise at night',     'user16', 'Please check 3rd floor noise.',   'in_progress', 'SUP_GENERAL', 'N', 'N'),
(2, 'Billing duplicated', 'user3',  'I think payment was duplicated.', 'resolved',    'SUP_BILLING', 'N', 'N');

/* reviews (기본 3개) */
INSERT INTO reviews
(review_id, user_id, room_id, rating, review_title, review_ctnt, code, file_ck, reply_ck)
VALUES
(1, 'user1', 2, 5, 'Great stay',  'Clean and quiet.',       'SUP_GENERAL', 'N', 'N'),
(2, 'user2', 3, 4, 'Good value',  'Reasonable rent.',       'SUP_GENERAL', 'N', 'N'),
(3, 'user4', 4, 3, 'Short stay',  'Okay for short period.', 'SUP_GENERAL', 'N', 'N');

INSERT INTO notification
(notification_id, receiver_id, code, sender_id, message, is_read, target_id, target, url_path)
VALUES
(1, 'user1',  'NOTI_NOTICE', 'hyunji2', 'Welcome notice has been published.', 'N', 1,    'notice', '/notices/1'),
(2, 'user3',  'NOTI_PAY',    'jinung2', 'Your payment failed. Please retry.', 'N', NULL, 'notice', '/payments/my'),
(3, 'user9',  'NOTI_NOTICE', 'jinung2', 'Your board got a new reply.',        'Y', 1,    'board',  '/community/boards/1'),
(4, 'user11', 'NOTI_NOTICE', 'jinung2', 'Your reply got a like.',             'N', 1,    'reply',  '/community/boards/1');

-- =========================================================
-- 9) cart (V2: building_id 포함)
-- =========================================================
INSERT INTO cart (cart_id, user_id) VALUES
(1, 'user13'),
(2, 'user14'),
(3, 'user15');

INSERT INTO cart_items (cart_item_id, cart_id, prod_id, building_id, order_quantity, order_price) VALUES
(1, 1, 1, 1, 2,  4500),
(2, 1, 4, 1, 1, 30000),
(3, 2, 2, 2, 1,  5500),
(4, 3, 3, 1, 3,  7000);

-- =========================================================
-- 10) payment lookup
-- =========================================================
INSERT INTO payment_method (payment_method_id, payment_method_nm, payment_method_cd, is_active) VALUES
(1, 'Card',          'CARD', 1),
(2, 'Bank Transfer', 'BANK', 1),
(3, 'Easy Pay',      'EASY', 1);

INSERT INTO service_goods (service_goods_id, service_goods_cd, service_goods_nm, is_active, display_order) VALUES
(1, 'SHOP',  'Commerce',         1, 1),
(2, 'MONTH', 'MonthlyCharge',    1, 2),
(3, 'SPACE', 'SpaceReservation', 1, 3);

INSERT INTO payment_status (status_cd, `description`, is_terminal, display_order, is_active) VALUES
('ready',     'ready to pay',      0, 1, 1),
('paid',      'payment success',   1, 2, 1),
('fail',      'payment failed',    1, 3, 1),
('cancelled', 'payment cancelled', 1, 4, 1);

INSERT INTO charge_status (status_cd, `description`, is_terminal, display_order, is_active) VALUES
('unpaid',  'not paid', 0, 1, 1),
('paid',    'paid',     1, 2, 1),
('overdue', 'overdue',  0, 3, 1);

-- =========================================================
-- 11) payments/orders (V2: order_items.building_id 포함)
-- =========================================================
INSERT INTO payment
(payment_id, user_id, service_goods_id, target_type, target_id, currency, total_price, captured_price, payment_method_id, provider, provider_payment_id, merchant_uid, idempotency_key, tax_scope_price, tax_ex_scope_price, tax_free_price, payment_st, paid_at)
VALUES
(1, 'user1', 1, 'order',          1, 'KRW',  39000,  39000, 1, 'iamport', 'imp_001',    'muid_order_001',  'idem_user1_001',  39000, 0, 0, 'paid', NOW()),
(2, 'user2', 1, 'order',          2, 'KRW',  12500,      0, 1, 'iamport', 'imp_002',    'muid_order_002',  'idem_user2_001',  12500, 0, 0, 'fail', NULL),
(3, 'user3', 1, 'order',          3, 'KRW',  30000,  30000, 2, 'kakao',   'kakao_003',  'muid_order_003',  'idem_user3_001',  30000, 0, 0, 'paid', NOW()),
(4, 'user4', 2, 'monthly_charge', 1, 'KRW', 460000, 460000, 2, 'kakao',   'kakao_004',  'muid_month_001',  'idem_user4_001', 460000, 0, 0, 'paid', NOW()),
(5, 'user5', 2, 'monthly_charge', 2, 'KRW', 550000,      0, 2, 'iamport', 'imp_005',    'muid_month_002',  'idem_user5_001', 550000, 0, 0, 'ready', NULL),
(6, 'user6', 2, 'monthly_charge', 3, 'KRW', 920000,      0, 1, 'iamport', 'imp_006',    'muid_month_003',  'idem_user6_001', 920000, 0, 0, 'fail', NULL),
(7, 'user7', 1, 'order',          4, 'KRW',  21000,  21000, 3, 'tosspay', 'toss_007',   'muid_order_004',  'idem_user7_001',  21000, 0, 0, 'paid', NOW()),
(8, 'user8', 3, 'order',          5, 'KRW',  15000,  15000, 3, 'tosspay', 'toss_008',   'muid_order_005',  'idem_user8_001',  15000, 0, 0, 'paid', NOW());

INSERT INTO orders (order_id, user_id, order_st, total_price, payment_id, order_created_at) VALUES
(1, 'user1', 'paid',      39000, 1, NOW()),
(2, 'user2', 'cancelled', 12500, 2, NOW()),
(3, 'user3', 'ended',     30000, 3, NOW()),
(4, 'user7', 'paid',      21000, 7, NOW()),
(5, 'user8', 'paid',      15000, 8, NOW());

/* V2: order_items building_id 포함 */
INSERT INTO order_items (order_item_id, order_id, prod_id, building_id, order_quantity, order_price) VALUES
(1, 1, 1, 1, 2,  4500),
(2, 1, 4, 1, 1, 30000),
(3, 2, 2, 2, 1,  5500),
(4, 2, 3, 2, 1,  7000),
(5, 3, 4, 1, 1, 30000),
(6, 4, 3, 1, 3,  7000),
(7, 5, 1, 2, 1,  4500),
(8, 5, 2, 2, 1,  5500),
(9, 5, 3, 2, 1,  7000);

INSERT INTO room_service_order (order_id, parent_order_id, user_id, room_id, total_price, order_st, room_service_desc) VALUES
(1, 1, 'user1', 2, 30000, 'paid',      'room cleaning request'),
(2, 4, 'user7', 1, 21000, 'requested', 'late-night snack'),
(3, 5, 'user8', 4, 15000, 'delivered', 'morning coffee');

INSERT INTO monthly_charge (charge_id, contract_id, charge_type, billing_dt, price, charge_st, payment_id) VALUES
(1, 4, 'rent',       '2026-03', 460000, 'paid',   4),
(2, 1, 'rent',       '2026-03', 550000, 'unpaid', 5),
(3, 6, 'rent',       '2026-03', 920000, 'overdue',6),
(4, 2, 'manage_fee', '2026-03',  60000, 'unpaid', NULL);

INSERT INTO payment_attempt (attempt_id, payment_id, attempt_st, finished_at) VALUES
(1, 1, 'approved',  NOW()),
(2, 2, 'failed',    NOW()),
(3, 3, 'approved',  NOW()),
(4, 4, 'approved',  NOW()),
(5, 5, 'requested', NULL),
(6, 6, 'failed',    NOW()),
(7, 7, 'approved',  NOW()),
(8, 8, 'approved',  NOW());

INSERT INTO payment_refund (refund_id, payment_id, refund_price, refund_st, refund_reason, completed_at) VALUES
(1, 3, 30000, 'done',      'admin refund for duplicate item', NOW()),
(2, 7,  5000, 'requested', 'partial refund request',          NULL),
(3, 2,     0, 'failed',    'payment failed already',          NOW());

INSERT INTO payment_intent
(payment_intent_id, payment_id, provider, intent_st, provider_ref_id, app_scheme_url, return_url, returned_params_json, pg_ready_json, pg_approve_json, fail_code, fail_message)
VALUES
(1, 1, 'iamport', 'APPROVE_OK',   'pref_001', 'uniplace://pay', 'https://example.com/return/1', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  JSON_OBJECT('approved',true),  NULL,        NULL),
(2, 2, 'iamport', 'APPROVE_FAIL', 'pref_002', 'uniplace://pay', 'https://example.com/return/2', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  JSON_OBJECT('approved',false), 'PMT_001',   'insufficient balance'),
(3, 3, 'kakao',   'APPROVE_OK',   'pref_003', 'uniplace://pay', 'https://example.com/return/3', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  JSON_OBJECT('approved',true),  NULL,        NULL),
(4, 4, 'kakao',   'APPROVE_OK',   'pref_004', 'uniplace://pay', 'https://example.com/return/4', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  JSON_OBJECT('approved',true),  NULL,        NULL),
(5, 5, 'iamport', 'READY_OK',     'pref_005', 'uniplace://pay', 'https://example.com/return/5', NULL,                            JSON_OBJECT('ready',true),  NULL,                          NULL,        NULL),
(6, 6, 'iamport', 'READY_FAIL',   'pref_006', 'uniplace://pay', 'https://example.com/return/6', NULL,                            JSON_OBJECT('ready',false), NULL,                          'READY_500', 'pg ready failed'),
(7, 7, 'tosspay', 'RETURNED',     'pref_007', 'uniplace://pay', 'https://example.com/return/7', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  NULL,                          NULL,        NULL),
(8, 8, 'tosspay', 'APPROVE_OK',   'pref_008', 'uniplace://pay', 'https://example.com/return/8', JSON_OBJECT('state','returned'), JSON_OBJECT('ready',true),  JSON_OBJECT('approved',true),  NULL,        NULL);

-- =========================================================
-- PART B. 추가 상품 + 리뷰 카테고리/리뷰 샘플 (V2 호환)
-- =========================================================

/* B-1. PRODUCT_CATEGORY 공통코드 추가 */
INSERT INTO common_code (group_code, code, code_value, description, display_order, is_active) VALUES
('PRODUCT_CATEGORY', 'PROD_DAILY',  '생활용품',  '생활용품 카테고리',     3, 1),
('PRODUCT_CATEGORY', 'PROD_ELEC',   '전자/가전', '소형가전 카테고리',     4, 1),
('PRODUCT_CATEGORY', 'PROD_HEALTH', '건강/위생', '건강·위생용품 카테고리',5, 1);

/* B-2. 리뷰 카테고리 그룹/코드 추가 */
INSERT INTO group_common_code (group_code, group_code_name, description, is_active)
VALUES ('REVIEW_CATEGORY', 'Review Category', 'Review classification', 1);

INSERT INTO common_code (group_code, code, code_value, description, display_order, is_active) VALUES
('REVIEW_CATEGORY', 'REV_ROOM',     '방 상태',     '방 컨디션·청결도 리뷰', 1, 1),
('REVIEW_CATEGORY', 'REV_FACILITY', '시설 편의',   '공용시설·편의시설 리뷰', 2, 1),
('REVIEW_CATEGORY', 'REV_MGMT',     '관리 서비스', '관리사무소·서비스 리뷰', 3, 1),
('REVIEW_CATEGORY', 'REV_LOCATION', '입지/교통',   '위치·교통 편의성 리뷰',  4, 1);

/* B-3. 신규 상품 (prod_id 6~17 고정 삽입: AUTO_INCREMENT 꼬임 방지) */
INSERT INTO product (prod_id, prod_nm, prod_price, prod_stock, code, prod_desc, prod_st, affiliate_id) VALUES
(6,  '즉석 컵라면 (신라면)', 1500, 200, 'PROD_FOOD',  '농심 신라면 컵 65g. 자취생 필수 간편식.', 'on_sale', 1),
(7,  '생수 2L 6입 세트',     4900, 100, 'PROD_FOOD',  '제주 삼다수 2L x 6병 묶음.',             'on_sale', 1),
(8,  '간편 도시락 (비빔밥)', 4500,  80, 'PROD_FOOD',  'CJ 햇반 컵반 비빔밥 280g.',              'on_sale', 1),
(9,  '세탁세제 (리큐 1L)',   7900,  60, 'PROD_DAILY', '리큐 파워크린 드럼/일반겸용 1L.',         'on_sale', 2),
(10, '화장지 30롤 묶음',    12000,  50, 'PROD_DAILY', '깨끗한나라 순수 3겹 30롤.',              'on_sale', 2),
(11, '주방세제 (퐁퐁 500ml)', 3500, 120, 'PROD_DAILY', 'LG생건 퐁퐁 플러스 500ml.',             'on_sale', 1),
(12, '물걸레 청소포 50매',   5500,  70, 'PROD_CLEAN', '크린랩 물걸레 청소포 대형 50매.',         'on_sale', 2),
(13, '욕실 청소 티슈 40매',  4200,  90, 'PROD_CLEAN', '욕실·화장실 전용 항균 청소티슈 40매.',    'on_sale', 2),
(14, '멀티탭 4구 (1.5m)',    9900,  40, 'PROD_ELEC',  '개별 스위치 4구 멀티탭 1.5m.',           'on_sale', 1),
(15, '마스크 KF80 50매',    15000, 150, 'PROD_HEALTH','KF80 보건용 마스크 50매 개별포장.',        'on_sale', NULL),
(16, '손소독제 500ml',       5900, 110, 'PROD_HEALTH','에탄올 62% 손소독제 500ml 펌프형.',       'on_sale', NULL),
(17, '비타민C 1000mg 60정', 12800,  55, 'PROD_HEALTH','고함량 비타민C 1000mg 60정. 2개월분.',   'on_sale', NULL);

/* B-4. 신규 상품 빌딩별 재고 (1~2 빌딩 기준) */
INSERT INTO product_building_stock (prod_id, building_id, stock) VALUES
(6,  1, 80), (6,  2, 70),
(7,  1, 40), (7,  2, 35),
(8,  1, 30), (8,  2, 28),
(9,  1, 25), (9,  2, 22),
(10, 1, 20), (10, 2, 18),
(11, 1, 50), (11, 2, 45),
(12, 1, 30), (12, 2, 25),
(13, 1, 38), (13, 2, 32),
(14, 1, 18), (14, 2, 15),
(15, 1, 60), (15, 2, 55),
(16, 1, 45), (16, 2, 42),
(17, 1, 22), (17, 2, 20);

/* B-5. 추가 리뷰 (REV_* 사용) */
INSERT INTO reviews (user_id, room_id, rating, review_title, review_ctnt, code, file_ck, reply_ck) VALUES
('user5',  1, 5, '깔끔하고 채광 최고예요',         '1층인데 창문이 크고 남향이라 햇빛이 잘 들어요.',     'REV_ROOM',     'N', 'N'),
('user6',  2, 4, '위치 편하고 방 상태 좋아요',      '주변 맛집도 많고 방도 청결하게 유지됩니다.',         'REV_LOCATION', 'N', 'N'),
('user7',  3, 5, '공용시설이 너무 편리해요',        '라운지와 미팅룸이 잘 갖춰져 재택근무하기 최고예요.', 'REV_FACILITY', 'N', 'N'),
('user8',  4, 3, '단기 숙박으로 나쁘지 않아요',     '스테이 타입으로 단기엔 괜찮으나 수납이 부족해요.',   'REV_MGMT',     'N', 'N'),
('user9',  5, 4, '넓고 쾌적한 방이에요',            '2인실이라 공간이 여유롭고 욕실도 깨끗해요.',         'REV_ROOM',     'N', 'N'),
('user10', 1, 4, '처음 자취하기에 딱 좋은 환경',    '관리사무소가 친절하고 주변에 편의점도 가까워요.',    'REV_LOCATION', 'N', 'N'),
('user11', 2, 5, '재계약 결정했습니다',             '1년 거주하면서 불편한 점이 거의 없었어요.',           'REV_FACILITY', 'N', 'N'),
('user12', 3, 4, '가격 대비 만족스러운 선택',       '관리비에 인터넷이 포함되어 매우 경제적이에요.',       'REV_MGMT',     'N', 'N');

-- =========================================================
-- done
-- =========================================================
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;





