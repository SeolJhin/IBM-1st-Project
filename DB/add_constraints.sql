/* =========================================================
 * Uni-Place : CONSTRAINT-ONLY SCRIPT
 * - “제약조건 부여” 구문만 추출
 * - FK/PK/UNIQUE/CHECK/INDEX(키) 포함
 * - DROP / FK CHECK 토글 제외
 * ========================================================= */

-- ===============================
-- 1) group_common_code
-- ===============================
ALTER TABLE group_common_code
  ADD PRIMARY KEY (group_code),
  ADD UNIQUE KEY uq_group_code_name (group_code_name);

-- ===============================
-- 2) common_code
-- ===============================
ALTER TABLE common_code
  ADD PRIMARY KEY (code),
  ADD KEY ix_common_code_group (group_code),
  ADD CONSTRAINT fk_common_code_group
    FOREIGN KEY (group_code) REFERENCES group_common_code(group_code);

-- ===============================
-- 3) users
-- ===============================
ALTER TABLE users
  ADD PRIMARY KEY (user_id),
  ADD UNIQUE KEY uq_users_email (user_email),
  ADD KEY ix_users_tel (user_tel);

-- ===============================
-- 4) refresh_tokens
-- ===============================
ALTER TABLE refresh_tokens
  ADD PRIMARY KEY (refresh_token_id),
  ADD UNIQUE KEY uq_refresh_token_hash (token_hash),
  ADD KEY ix_refresh_tokens_user    (user_id),
  ADD KEY ix_refresh_tokens_device  (user_id, device_id),
  ADD KEY ix_refresh_tokens_expires (expires_at),
  ADD CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ===============================
-- 5) social_accounts
-- ===============================
ALTER TABLE social_accounts
  ADD PRIMARY KEY (social_account_id),
  ADD CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),
  ADD KEY ix_oauth_user (user_id),
  ADD CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ===============================
-- 6) building
-- ===============================
ALTER TABLE building
  ADD PRIMARY KEY (building_id),
  ADD KEY ix_building_delete (delete_yn);

-- ===============================
-- 7) rooms
-- ===============================
ALTER TABLE rooms
  ADD PRIMARY KEY (room_id),
  ADD UNIQUE KEY uq_rooms_building_roomno (building_id, room_no),
  ADD KEY ix_rooms_building (building_id),
  ADD KEY ix_rooms_delete   (delete_yn),
  ADD CONSTRAINT fk_rooms_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

-- ===============================
-- 8) common_space
-- ===============================
ALTER TABLE common_space
  ADD PRIMARY KEY (space_id),
  ADD KEY ix_common_space_building (building_id),
  ADD CONSTRAINT fk_common_space_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

-- ===============================
-- 9) files
-- ===============================
ALTER TABLE files
  ADD PRIMARY KEY (file_id),
  ADD KEY ix_files_parent  (file_parent_type, file_parent_id),
  ADD KEY ix_files_created (created_at);

-- ===============================
-- 10) company_info
-- ===============================
ALTER TABLE company_info
  ADD PRIMARY KEY (company_id);

-- ===============================
-- 11) banner
-- ===============================
ALTER TABLE banner
  ADD PRIMARY KEY (ban_id);

-- ===============================
-- 12) affiliate
-- ===============================
ALTER TABLE affiliate
  ADD PRIMARY KEY (affiliate_id),
  ADD KEY ix_affiliate_building (building_id),
  ADD CONSTRAINT fk_affiliate_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

-- ===============================
-- 13) product
-- ===============================
ALTER TABLE product
  ADD PRIMARY KEY (prod_id),
  ADD KEY ix_product_code (code),
  ADD CONSTRAINT fk_product_code
    FOREIGN KEY (code) REFERENCES common_code(code),
  ADD CONSTRAINT fk_product_affiliate
    FOREIGN KEY (affiliate_id) REFERENCES affiliate(affiliate_id);

-- ===============================
-- 14) contract
-- ===============================
ALTER TABLE contract
  ADD PRIMARY KEY (contract_id),
  ADD KEY ix_contract_user (user_id),
  ADD KEY ix_contract_room (room_id),
  ADD CONSTRAINT fk_contract_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_contract_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id);

-- ===============================
-- 15) residents
-- ===============================
ALTER TABLE residents
  ADD PRIMARY KEY (resident_id),
  ADD UNIQUE KEY uq_resident (contract_id, user_id),
  ADD KEY ix_residents_building (building_id),
  ADD CONSTRAINT fk_residents_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_residents_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  ADD CONSTRAINT fk_residents_user
    FOREIGN KEY (user_id) REFERENCES users(user_id);

-- ===============================
-- 16) room_reservation
-- ===============================
ALTER TABLE room_reservation
  ADD PRIMARY KEY (tour_id),
  ADD KEY ix_room_rsv_building (building_id),
  ADD KEY ix_room_rsv_room     (room_id),
  ADD CONSTRAINT fk_room_rsv_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_room_rsv_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id);

-- ===============================
-- 17) space_reservations
-- ===============================
ALTER TABLE space_reservations
  ADD PRIMARY KEY (reservation_id),
  ADD KEY ix_space_rsv_building (building_id),
  ADD KEY ix_space_rsv_space    (space_id),
  ADD KEY ix_space_rsv_user     (user_id),
  ADD CONSTRAINT chk_sr_time CHECK (sr_start_at < sr_end_at),
  ADD CONSTRAINT fk_space_rsv_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_space_rsv_space
    FOREIGN KEY (space_id) REFERENCES common_space(space_id),
  ADD CONSTRAINT fk_space_rsv_user
    FOREIGN KEY (user_id) REFERENCES users(user_id);

-- ===============================
-- 18) board
-- ===============================
ALTER TABLE board
  ADD PRIMARY KEY (board_id),
  ADD KEY ix_board_user (user_id),
  ADD KEY ix_board_code (code),
  ADD CONSTRAINT fk_board_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_board_code
    FOREIGN KEY (code) REFERENCES common_code(code);

-- ===============================
-- 19) reply
-- ===============================
ALTER TABLE reply
  ADD PRIMARY KEY (reply_id),
  ADD KEY ix_reply_board  (board_id),
  ADD KEY ix_reply_user   (user_id),
  ADD KEY ix_reply_parent (parent_id),
  ADD CONSTRAINT fk_reply_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_parent
    FOREIGN KEY (parent_id) REFERENCES reply(reply_id) ON DELETE CASCADE;

-- ===============================
-- 20) board_likes
-- ===============================
ALTER TABLE board_likes
  ADD PRIMARY KEY (user_id, board_id),
  ADD CONSTRAINT fk_board_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_board_likes_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE;

-- ===============================
-- 21) reply_likes
-- ===============================
ALTER TABLE reply_likes
  ADD PRIMARY KEY (user_id, reply_id),
  ADD CONSTRAINT fk_reply_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_likes_reply
    FOREIGN KEY (reply_id) REFERENCES reply(reply_id) ON DELETE CASCADE;

-- ===============================
-- 22) notice
-- ===============================
ALTER TABLE notice
  ADD PRIMARY KEY (notice_id),
  ADD KEY ix_notice_user (user_id),
  ADD KEY ix_notice_code (code),
  ADD CONSTRAINT fk_notice_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_notice_code
    FOREIGN KEY (code) REFERENCES common_code(code);

-- ===============================
-- 23) faq
-- ===============================
ALTER TABLE faq
  ADD PRIMARY KEY (faq_id),
  ADD KEY ix_faq_code (code),
  ADD CONSTRAINT fk_faq_code
    FOREIGN KEY (code) REFERENCES common_code(code);

-- ===============================
-- 24) qna
-- ===============================
ALTER TABLE qna
  ADD PRIMARY KEY (qna_id),
  ADD KEY ix_qna_user   (user_id),
  ADD KEY ix_qna_code   (code),
  ADD KEY ix_qna_parent (parent_id),
  ADD CONSTRAINT fk_qna_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_qna_code
    FOREIGN KEY (code) REFERENCES common_code(code),
  ADD CONSTRAINT fk_qna_parent_id
    FOREIGN KEY (parent_id) REFERENCES qna(qna_id) ON DELETE CASCADE;

-- ===============================
-- 25) complain
-- ===============================
ALTER TABLE complain
  ADD PRIMARY KEY (comp_id),
  ADD KEY ix_complain_user (user_id),
  ADD KEY ix_complain_code (code),
  ADD CONSTRAINT fk_complain_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_complain_code
    FOREIGN KEY (code) REFERENCES common_code(code);

-- ===============================
-- 26) reviews
-- ===============================
ALTER TABLE reviews
  ADD PRIMARY KEY (review_id),
  ADD UNIQUE KEY uq_reviews_user_room (user_id, room_id),
  ADD KEY ix_reviews_room (room_id),
  ADD KEY ix_reviews_code (code),
  ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_reviews_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  ADD CONSTRAINT fk_reviews_code
    FOREIGN KEY (code) REFERENCES common_code(code);

-- ===============================
-- 27) notification
-- ===============================
ALTER TABLE notification
  ADD PRIMARY KEY (notification_id),
  ADD KEY ix_notification_receiver (receiver_id),
  ADD CONSTRAINT fk_notification_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notification_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id);

-- ===============================
-- 28) cart
-- ===============================
ALTER TABLE cart
  ADD PRIMARY KEY (cart_id),
  ADD KEY ix_cart_user (user_id),
  ADD CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- ===============================
-- 29) cart_items
-- ===============================
ALTER TABLE cart_items
  ADD PRIMARY KEY (cart_item_id),
  ADD UNIQUE KEY uq_cart_item (cart_id, prod_id),
  ADD KEY ix_cart_items_cart (cart_id),
  ADD KEY ix_cart_items_prod (prod_id),
  ADD CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_cart_items_prod
    FOREIGN KEY (prod_id) REFERENCES product(prod_id);

-- ===============================
-- 30) payment_method
-- ===============================
ALTER TABLE payment_method
  ADD PRIMARY KEY (payment_method_id),
  ADD UNIQUE KEY uq_payment_method_code (payment_method_cd);

-- ===============================
-- 31) service_goods
-- ===============================
ALTER TABLE service_goods
  ADD PRIMARY KEY (service_goods_id),
  ADD UNIQUE KEY uq_service_goods_cd (service_goods_cd);

-- ===============================
-- 32) payment_status
-- ===============================
ALTER TABLE payment_status
  ADD PRIMARY KEY (status_cd);

-- ===============================
-- 33) charge_status
-- ===============================
ALTER TABLE charge_status
  ADD PRIMARY KEY (status_cd);

-- ===============================
-- 34) payment
-- ===============================
ALTER TABLE payment
  ADD PRIMARY KEY (payment_id),
  ADD UNIQUE KEY uq_payment_merchant_uid        (merchant_uid),
  ADD UNIQUE KEY uq_payment_user_idempotency    (user_id, idempotency_key),
  ADD UNIQUE KEY uq_payment_provider_payment_id (provider, provider_payment_id),
  ADD KEY ix_payment_user        (user_id),
  ADD KEY ix_payment_provider    (provider, provider_payment_id),
  ADD KEY ix_payment_idempotency (idempotency_key),
  ADD KEY ix_payment_target      (target_type, target_id),
  ADD CONSTRAINT fk_payment_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id),
  ADD CONSTRAINT fk_payment_service_goods
    FOREIGN KEY (service_goods_id) REFERENCES service_goods(service_goods_id),
  ADD CONSTRAINT chk_payment_target_type
    CHECK (target_type IN ('order', 'monthly_charge'));

-- ===============================
-- 35) orders
-- ===============================
ALTER TABLE orders
  ADD PRIMARY KEY (order_id),
  ADD KEY ix_orders_user    (user_id),
  ADD KEY ix_orders_payment (payment_id),
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_orders_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

-- ===============================
-- 36) order_items
-- ===============================
ALTER TABLE order_items
  ADD PRIMARY KEY (order_item_id),
  ADD KEY ix_order_items_order (order_id),
  ADD KEY ix_order_items_prod  (prod_id),
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
  ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (prod_id) REFERENCES product(prod_id);

-- ===============================
-- 37) room_service_order
-- ===============================
ALTER TABLE room_service_order
  ADD PRIMARY KEY (order_id),
  ADD KEY ix_rso_parent_order (parent_order_id),
  ADD KEY ix_rso_user         (user_id),
  ADD KEY ix_rso_room         (room_id),
  ADD CONSTRAINT fk_rso_parent_order
    FOREIGN KEY (parent_order_id) REFERENCES orders(order_id),
  ADD CONSTRAINT fk_rso_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_rso_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id);

-- ===============================
-- 38) monthly_charge
-- ===============================
ALTER TABLE monthly_charge
  ADD PRIMARY KEY (charge_id),
  ADD KEY ix_monthly_charge_contract (contract_id),
  ADD KEY ix_monthly_charge_billing  (billing_dt),
  ADD CONSTRAINT fk_monthly_charge_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  ADD CONSTRAINT fk_monthly_charge_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

-- ===============================
-- 39) payment_attempt
-- ===============================
ALTER TABLE payment_attempt
  ADD PRIMARY KEY (attempt_id),
  ADD KEY ix_payment_attempt (payment_id),
  ADD CONSTRAINT fk_payment_attempt
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

-- ===============================
-- 40) payment_refund
-- ===============================
ALTER TABLE payment_refund
  ADD PRIMARY KEY (refund_id),
  ADD KEY ix_payment_refund (payment_id),
  ADD CONSTRAINT fk_payment_refund
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

-- ===============================
-- 41) payment_intent
-- ===============================
ALTER TABLE payment_intent
  ADD PRIMARY KEY (payment_intent_id),
  ADD KEY ix_payment_intent_payment      (payment_id),
  ADD KEY ix_payment_intent_provider_ref (provider, provider_ref_id),
  ADD UNIQUE KEY uq_payment_intent_provider_ref (provider, provider_ref_id),
  ADD CONSTRAINT fk_payment_intent_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);