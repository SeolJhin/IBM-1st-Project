/* =========================================================
 * DROP TABLES (child -> parent)
 * - FK 제약조건 기준으로 안전한 삭제 순서
 * ========================================================= */

-- 1) payment 하위(자식)
DROP TABLE IF EXISTS payment_refund;
DROP TABLE IF EXISTS payment_attempt;

-- 2) order 하위(자식)
DROP TABLE IF EXISTS order_items;

-- 3) 게시판/댓글/좋아요 하위(자식)
DROP TABLE IF EXISTS reply_likes;
DROP TABLE IF EXISTS board_likes;

-- 4) 댓글(자기참조 FK 포함) - likes 먼저 삭제 후 reply 삭제
DROP TABLE IF EXISTS reply;

-- 5) 예약 하위(자식)
DROP TABLE IF EXISTS space_reservations;
DROP TABLE IF EXISTS room_reservation;

-- 6) cart 하위(자식)
DROP TABLE IF EXISTS cart;

-- 7) 계약/거주 하위(자식)
DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS monthly_charge;

-- 8) 룸서비스/리뷰/알림/게시글/민원 등 (payment/users/rooms 참조)
DROP TABLE IF EXISTS room_service_order;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notification;

-- 9) 주문(orders) : order_items를 먼저 지웠으므로 OK
DROP TABLE IF EXISTS orders;

-- 10) 파일(독립)
DROP TABLE IF EXISTS files;

-- 11) 게시판 상위(부모)
DROP TABLE IF EXISTS complain;
DROP TABLE IF EXISTS faq;
DROP TABLE IF EXISTS notice;
DROP TABLE IF EXISTS qna;
DROP TABLE IF EXISTS board;

-- 12) 결제(부모) : attempt/refund/orders/monthly_charge/room_service_order 모두 삭제 후
DROP TABLE IF EXISTS payment;

-- 13) 계약(부모) : residents/monthly_charge 삭제 후
DROP TABLE IF EXISTS contract;

-- 14) 상품(부모) : cart/order_items 삭제 후
DROP TABLE IF EXISTS product;

-- 15) 배너/회사정보 등 독립
DROP TABLE IF EXISTS banner;
DROP TABLE IF EXISTS company_info;

-- 16) 공간/객실(부모) : 예약/리뷰/룸서비스/계약 삭제 후
DROP TABLE IF EXISTS common_space;
DROP TABLE IF EXISTS rooms;

-- 17) 제휴사(부모) : product 삭제 후
DROP TABLE IF EXISTS affiliate;

-- 18) 서비스/결제수단(부모) : payment 삭제 후
DROP TABLE IF EXISTS service_goods;
DROP TABLE IF EXISTS payment_method;

-- 19) 상태 사전(독립)
DROP TABLE IF EXISTS charge_status;
DROP TABLE IF EXISTS payment_status;

-- 20) 카테고리(부모)
DROP TABLE IF EXISTS notice_category;
DROP TABLE IF EXISTS product_category;
DROP TABLE IF EXISTS board_category;

-- 21) 건물(부모) : rooms/common_space/affiliate/room_reservation/space_reservations/residents 모두 삭제 후
DROP TABLE IF EXISTS building;

-- 22) 사용자(최상위 부모)
DROP TABLE IF EXISTS users;
