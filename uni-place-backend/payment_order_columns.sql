-- Add linkage and idempotency columns to payment
ALTER TABLE payment
  ADD COLUMN merchant_uid VARCHAR(100) NOT NULL COMMENT 'our payment order id',
  ADD COLUMN idempotency_key VARCHAR(100) NULL COMMENT 'server idempotency key',
  ADD COLUMN target_id INT NULL COMMENT 'order_id or charge_id',
  ADD COLUMN target_type VARCHAR(20) NULL COMMENT 'order | monthly_charge',
  ADD UNIQUE KEY uq_payment_merchant_uid (merchant_uid),
  ADD KEY ix_payment_target (target_id),
  ADD KEY ix_payment_idempotency (idempotency_key);
