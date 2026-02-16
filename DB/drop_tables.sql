/* =========================================================
 * Uni-Place : DROP SCRIPT (자식 -> 부모 순)
 * - FK 충돌 방지
 * - 반복 실행 안전 (IF EXISTS)
 * ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;

/* ===== 1) PAYMENT / ORDER / CHARGE (deep children first) ===== */
DROP TABLE IF EXISTS payment_refund;
DROP TABLE IF EXISTS payment_attempt;

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
DROP TABLE IF EXISTS users;

/* ===== 10) COMMON CODES (parents last) ===== */
DROP TABLE IF EXISTS common_code;
DROP TABLE IF EXISTS group_common_code;

SET FOREIGN_KEY_CHECKS = 1;
