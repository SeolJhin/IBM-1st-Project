
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