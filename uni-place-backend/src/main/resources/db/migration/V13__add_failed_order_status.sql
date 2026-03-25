-- orders 테이블: order_st ENUM에 'failed' 추가
ALTER TABLE orders
    MODIFY COLUMN order_st ENUM('ordered','paid','ended','cancelled','failed') NOT NULL DEFAULT 'ordered';

-- room_service_order 테이블: order_st ENUM에 'failed' 추가
ALTER TABLE room_service_order
    MODIFY COLUMN order_st ENUM('requested','paid','delivered','cancelled','failed') NOT NULL DEFAULT 'requested';
