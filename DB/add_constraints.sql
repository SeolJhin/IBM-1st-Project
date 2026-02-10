/* users UNIQUE */
ALTER TABLE users
  ADD CONSTRAINT uq_users_email UNIQUE (user_email),
  ADD CONSTRAINT uq_users_tel   UNIQUE (user_tel);

/* rooms: UNIQUE + FK */
ALTER TABLE rooms
  ADD CONSTRAINT uq_rooms_building_roomnum UNIQUE (building_id, room_num),
  ADD CONSTRAINT fk_rooms_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

/* common_space FK */
ALTER TABLE common_space
  ADD CONSTRAINT fk_common_space_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

/* affiliate FK */
ALTER TABLE affiliate
  ADD CONSTRAINT fk_affiliate_building
    FOREIGN KEY (building_id) REFERENCES building(building_id);

/* room_reservation FK */
ALTER TABLE room_reservation
  ADD CONSTRAINT fk_room_reservation_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_room_reservation_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id);

/* space_reservations UNIQUE + CHECK + FK */
ALTER TABLE space_reservations
  ADD CONSTRAINT uq_space_time UNIQUE (space_id, sr_start_time, sr_end_time),
  ADD CONSTRAINT chk_space_time CHECK (sr_start_time < sr_end_time),
  ADD CONSTRAINT fk_space_reservation_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_space_reservation_space
    FOREIGN KEY (space_id) REFERENCES common_space(space_id),
  ADD CONSTRAINT fk_space_reservation_user
    FOREIGN KEY (user_id) REFERENCES users(user_id);

/* board FK */
ALTER TABLE board
  ADD CONSTRAINT fk_board_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code);

/* qna FK */
ALTER TABLE qna
  ADD CONSTRAINT fk_qna_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_qna_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code);

/* notice FK */
ALTER TABLE notice
  ADD CONSTRAINT fk_notice_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_notice_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code),
  ADD CONSTRAINT fk_notice_category
    FOREIGN KEY (notice_category_code) REFERENCES notice_category(notice_category_code);

/* faq FK */
ALTER TABLE faq
  ADD CONSTRAINT fk_faq_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code);

/* reply FK (CASCADE 포함) */
ALTER TABLE reply
  ADD CONSTRAINT fk_reply_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_parent
    FOREIGN KEY (parent_comment_id) REFERENCES reply(reply_no) ON DELETE CASCADE;

/* board_likes FK */
ALTER TABLE board_likes
  ADD CONSTRAINT fk_board_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_board_likes_board
    FOREIGN KEY (board_id) REFERENCES board(board_id) ON DELETE CASCADE;

/* reply_likes FK */
ALTER TABLE reply_likes
  ADD CONSTRAINT fk_reply_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_reply_likes_reply
    FOREIGN KEY (reply_no) REFERENCES reply(reply_no) ON DELETE CASCADE;

/* complain FK */
ALTER TABLE complain
  ADD CONSTRAINT fk_complain_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_complain_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code);

/* product FK */
ALTER TABLE product
  ADD CONSTRAINT fk_product_affiliate
    FOREIGN KEY (affiliate_id) REFERENCES affiliate(affiliate_no),
  ADD CONSTRAINT fk_product_product_category
    FOREIGN KEY (prod_category_id) REFERENCES product_category(prod_category_id);

/* cart UNIQUE + FK */
ALTER TABLE cart
  ADD CONSTRAINT uq_cart_user_product UNIQUE (user_id, prod_id),
  ADD CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_cart_product
    FOREIGN KEY (prod_id) REFERENCES product(prod_id) ON DELETE CASCADE;

/* contract FK */
ALTER TABLE contract
  ADD CONSTRAINT fk_contract_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_contract_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id);

/* residents FK */
ALTER TABLE residents
  ADD CONSTRAINT fk_residents_building
    FOREIGN KEY (building_id) REFERENCES building(building_id),
  ADD CONSTRAINT fk_residents_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  ADD CONSTRAINT fk_residents_user
    FOREIGN KEY (user_id) REFERENCES users(user_id);

/* payment: FK + 인덱스 */
ALTER TABLE payment
  ADD KEY ix_payment_user (user_id),
  ADD KEY ix_payment_provider (provider, provider_payment_id),
  ADD KEY ix_payment_tid (provider, provider_tid),
  ADD CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id),
  ADD CONSTRAINT fk_payment_service_goods
    FOREIGN KEY (service_goods_id) REFERENCES service_goods(service_goods_id);

/* payment_method: UNIQUE */
ALTER TABLE payment_method
  ADD CONSTRAINT uq_payment_method_code UNIQUE (payment_method_code);

/* orders FK */
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_orders_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

/* order_items FK */
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_no) REFERENCES orders(order_no),
  ADD CONSTRAINT fk_order_items_product
    FOREIGN KEY (prod_id) REFERENCES product(prod_id);

/* monthly_charge FK */
ALTER TABLE monthly_charge
  ADD CONSTRAINT fk_monthly_charge_contract
    FOREIGN KEY (contract_id) REFERENCES contract(contract_id),
  ADD CONSTRAINT fk_monthly_charge_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

/* room_service_order FK */
ALTER TABLE room_service_order
  ADD CONSTRAINT fk_room_service_order_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_room_service_order_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  ADD CONSTRAINT fk_room_service_order_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

/* notification FK */
ALTER TABLE notification
  ADD CONSTRAINT fk_notification_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notification_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id);

/* reviews UNIQUE + CHECK + FK */
ALTER TABLE reviews
  ADD CONSTRAINT uq_review_user_room UNIQUE (user_id, room_id),
  ADD CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  ADD CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  ADD CONSTRAINT fk_reviews_room
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
  ADD CONSTRAINT fk_reviews_board_category
    FOREIGN KEY (board_code) REFERENCES board_category(board_code);

/* payment_attempt FK */
ALTER TABLE payment_attempt
  ADD CONSTRAINT fk_payment_attempt_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);

/* payment_refund FK */
ALTER TABLE payment_refund
  ADD CONSTRAINT fk_payment_refund_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id);
