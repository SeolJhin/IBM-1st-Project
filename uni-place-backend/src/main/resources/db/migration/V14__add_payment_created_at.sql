-- payment 테이블: created_at 컬럼 추가
ALTER TABLE payment
    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER paid_at;
