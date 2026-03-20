/* =========================================================
 * Uni-Place : V11 마이그레이션
 * [복구 목적]
 *   V5, V6가 방·건물 데이터 교체 과정에서 아래 테이블을
 *   DELETE 로 완전히 삭제해버림 → 샘플 데이터 복구
 *
 *   복구 대상:
 *     - contract          (계약)
 *     - residents         (입주자)
 *     - room_reservation  (방 투어 예약)
 *     - space_reservations(공용공간 예약)
 *
 *   비대상 (V5/V6가 건드리지 않은 데이터 → 그대로 유지):
 *     - users, board, reply, reviews, payment, orders 등
 *
 * [배포 안전 처리]
 *   - INSERT IGNORE: 이미 데이터가 있으면 에러 없이 건너뜀
 *                    (멱등성(여러 번 실행해도 같은 결과) 보장)
 *   - V6 기준 room_id → building_id 매핑 반영
 *     · room_id  1~ 50 = Uniplace A (building_id = 1)
 *     · room_id 51~100 = Uniplace B (building_id = 2)
 *     · room_id 101~150= Uniplace C (building_id = 3)
 *   - V5/V6에서 room_id 가 재정렬되었으므로
 *     기존 V2 샘플 room_id (1~6) 를 V6 기준 id 로 재매핑
 *
 * [V6 기준 room_id 재매핑 참고]
 *   V2 room 1 (A-101 one_room)  → V6 room_id 1   (building 1)
 *   V2 room 2 (A-102 one_room)  → V6 room_id 2   (building 1)
 *   V2 room 3 (A-201 one_room)  → V6 room_id 3   (building 1)
 *   V2 room 4 (B-301 stay)      → V6 room_id 4   (building 1, one_room)
 *   V2 room 5 (B-401 reserved)  → V6 room_id 5   (building 1, one_room)
 *   V2 room 6 (C-501 repair)    → V6 room_id 6   (building 1, one_room)
 * ========================================================= */

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_SAFE_UPDATES    = 0;


-- =========================================================
-- 1) contract (계약)
--    PRIMARY KEY = contract_id → INSERT IGNORE 로 중복 방지
-- =========================================================
INSERT IGNORE INTO contract
(contract_id, user_id, room_id,
 contract_start, contract_end,
 deposit, rent_price, manage_fee,
 payment_day, contract_st,
 sign_at, movein_at,
 rent_type,
 lessor_nm, lessor_tel, lessor_addr, lessor_rrn,
 lessor_sign_file_id, contract_pdf_file_id)
VALUES
-- user1 / room 2 (A-102 one_room, building 1)
(1, 'user1', 2,
 '2026-01-01', '2026-12-31',
 1200000, 550000, 50000,
 10, 'active',
 NOW(), NOW(),
 'monthly_rent',
 'Lessor A', '010-8000-0001', 'Seoul A', '900101-1234567',
 NULL, NULL),

-- user2 / room 3 (A-201 one_room, building 1)
(2, 'user2', 3,
 '2026-02-01', '2027-01-31',
 1500000, 620000, 60000,
 10, 'active',
 NOW(), NOW(),
 'monthly_rent',
 'Lessor B', '010-8000-0002', 'Seoul A', '900102-1234567',
 NULL, NULL),

-- user3 / room 5 (A-502 one_room, building 1) — requested (미입주)
(3, 'user3', 5,
 '2026-03-01', '2027-02-28',
 1600000, 620000, 70000,
 12, 'requested',
 NOW(), NULL,
 'monthly_rent',
 'Lessor C', '010-8000-0003', 'Seoul B', '900103-1234567',
 NULL, NULL),

-- user4 / room 4 (A-402 one_room, building 1)
(4, 'user4', 4,
 '2026-01-15', '2026-07-14',
 1200000, 520000, 60000,
 5, 'active',
 NOW(), NOW(),
 'monthly_rent',
 'Lessor D', '010-8000-0004', 'Seoul B', '900104-1234567',
 NULL, NULL),

-- user5 / room 1 (A-101 one_room, building 1) — requested (미입주)
(5, 'user5', 1,
 '2026-04-01', '2027-03-31',
 1000000, 500000, 50000,
 15, 'requested',
 NOW(), NULL,
 'monthly_rent',
 'Lessor E', '010-8000-0005', 'Seoul A', '900105-1234567',
 NULL, NULL),

-- user6 / room 6 (A-601 one_room, building 1) — ended (종료)
(6, 'user6', 6,
 '2025-01-01', '2025-12-31',
 1100000, 490000, 55000,
 20, 'ended',
 NOW(), NOW(),
 'monthly_rent',
 'Lessor F', '010-8000-0006', 'Seoul C', '900106-1234567',
 NULL, NULL);


-- =========================================================
-- 2) residents (입주자)
--    UNIQUE KEY = (contract_id, user_id) → INSERT IGNORE
--    V6 기준: room 1~50 모두 building_id = 1
-- =========================================================
INSERT IGNORE INTO residents
(resident_id, building_id, contract_id, user_id)
VALUES
(1, 1, 1, 'user1'),  -- contract 1, room 2, building A
(2, 1, 2, 'user2'),  -- contract 2, room 3, building A
(3, 1, 4, 'user4');  -- contract 4, room 4, building A


-- =========================================================
-- 3) room_reservation (방 투어 예약)
--    PRIMARY KEY = tour_id → INSERT IGNORE
--    V6 기준 room_id 1~50 = building_id 1
-- =========================================================
INSERT IGNORE INTO room_reservation
(tour_id, building_id, room_id,
 tour_start_at, tour_end_at,
 tour_nm, tour_tel,
 tour_st, tour_pwd)
VALUES
(1,  1, 1, '2026-03-10 10:00:00', '2026-03-10 10:30:00', 'Kim Guest',   '010-7000-0001', 'requested', '1234'),
(2,  1, 3, '2026-03-11 14:00:00', '2026-03-11 14:30:00', 'Lee Guest',   '010-7000-0002', 'confirmed', '2345'),
-- 아래 3건은 원본 V2에서 building 2/3이었으나 V6 기준 room 4/6 은 building 1 소속 → 수정
(3,  1, 4, '2026-03-12 16:00:00', '2026-03-12 16:30:00', 'Park Guest',  '010-7000-0003', 'ended',     '3456'),
(4,  1, 6, '2026-03-13 11:00:00', '2026-03-13 11:30:00', 'Choi Guest',  '010-7000-0004', 'cancelled', '4567'),
(5,  1, 1, '2026-03-03 10:00:00', '2026-03-03 11:00:00', 'Kim2 Guest',  '010-7000-0005', 'ended',     '1234'),
(6,  1, 1, '2026-03-01 11:00:00', '2026-03-01 12:00:00', 'Park2 Guest', '010-7000-0006', 'ended',     '1234'),
(7,  1, 1, '2026-02-24 13:00:00', '2026-02-24 14:00:00', 'Choi2 Guest', '010-7000-0007', 'confirmed', '1234'),
(8,  1, 1, '2026-02-15 14:00:00', '2026-02-15 15:00:00', 'Lee2 Guest',  '010-7000-0008', 'ended',     '1234'),
(9,  1, 1, '2026-02-12 16:00:00', '2026-02-12 17:00:00', 'Jung Guest',  '010-7000-0009', 'confirmed', '1234'),
(10, 1, 1, '2025-01-03 10:00:00', '2025-01-03 11:00:00', 'Jung2 Guest', '010-7000-0010', 'ended',     '1234');


-- =========================================================
-- 4) space_reservations (공용공간 예약)
--    PRIMARY KEY = reservation_id → INSERT IGNORE
--    V6 기준 space_id → building_id 매핑:
--      space_id  1~ 6 = building 1 (Uniplace A)
--      space_id  7~12 = building 2 (Uniplace B)
--      space_id 13~18 = building 3 (Uniplace C)
-- =========================================================
INSERT IGNORE INTO space_reservations
(reservation_id, building_id, space_id, user_id,
 sr_start_at, sr_end_at,
 sr_no_people, sr_st)
VALUES
(1,  1, 1, 'user1', '2026-03-15 09:00:00', '2026-03-15 11:00:00', 4, 'requested'),
-- 원본 V2: building 2, space 6 → V6 기준 space 6 = 코워킹스페이스 A → building 1
(2,  1, 6, 'user4', '2026-03-16 19:00:00', '2026-03-16 21:00:00', 8, 'confirmed'),
(3,  1, 2, 'user2', '2026-03-17 13:00:00', '2026-03-17 14:00:00', 3, 'ended'),
(4,  1, 4, 'user2', '2026-03-18 07:00:00', '2026-03-18 08:00:00', 2, 'cancelled'),
(5,  1, 4, 'user2', '2026-03-17 13:00:00', '2026-03-17 14:00:00', 3, 'ended'),
(6,  1, 4, 'user1', '2026-03-18 07:00:00', '2026-03-18 08:00:00', 2, 'requested'),
(7,  1, 3, 'user2', '2026-03-17 13:00:00', '2026-03-17 14:00:00', 3, 'requested'),
-- space_id 8 = 스터디룸 B → building 2
(8,  2, 8, 'user4', '2026-03-18 07:00:00', '2026-03-18 08:00:00', 1, 'requested'),
(9,  2, 8, 'user4', '2026-03-17 13:00:00', '2026-03-17 14:00:00', 1, 'cancelled'),
(10, 1, 4, 'user2', '2026-03-18 07:00:00', '2026-03-18 08:00:00', 2, 'cancelled');


SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES    = 1;


-- =========================================================
-- 완료 확인 쿼리
-- =========================================================
SELECT '계약 수'         AS label, COUNT(*) AS cnt FROM contract
UNION ALL SELECT '입주자 수',        COUNT(*) FROM residents
UNION ALL SELECT '방 예약 수',       COUNT(*) FROM room_reservation
UNION ALL SELECT '공간 예약 수',     COUNT(*) FROM space_reservations;
