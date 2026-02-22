-- Add order linkage to payment
ALTER TABLE payment
  ADD COLUMN order_id INT NULL,
  ADD COLUMN order_type VARCHAR(20) NULL,
  ADD KEY ix_payment_order (order_id);
