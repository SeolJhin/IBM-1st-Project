/* =========================================================
 * Uni-Place : V3 마이그레이션
 * - FAQ_CATEGORY 그룹 및 카테고리 코드 추가
 * - INSERT IGNORE: 이미 존재하면 에러 없이 건너뜀 (멱등성 보장)
 * ========================================================= */

-- ★ FAQ_CATEGORY 그룹 추가
INSERT IGNORE INTO group_common_code (group_code, group_code_name, description, is_active) VALUES
('FAQ_CATEGORY', 'FAQ Category', 'FAQ type category', 1);

-- ★ FAQ 카테고리 코드 추가
INSERT IGNORE INTO common_code (group_code, code, code_value, description, display_order, is_active) VALUES
('FAQ_CATEGORY', 'SUP_GENERAL',     '일반',      'General FAQ',       1, 1),
('FAQ_CATEGORY', 'SUP_BILLING',     '요금/정산', 'Billing FAQ',       2, 1),
('FAQ_CATEGORY', 'FAQ_CONTRACT',    '계약',      'Contract FAQ',      3, 1),
('FAQ_CATEGORY', 'FAQ_FACILITY',    '시설 이용', 'Facility FAQ',      4, 1),
('FAQ_CATEGORY', 'FAQ_MOVEINOUT',   '입주/퇴실', 'Move in/out FAQ',   5, 1),
('FAQ_CATEGORY', 'FAQ_ROOMSERVICE', '룸서비스',  'Room service FAQ',  6, 1),
('FAQ_CATEGORY', 'FAQ_COMMUNITY',   '커뮤니티',  'Community FAQ',     7, 1),
('FAQ_CATEGORY', 'FAQ_ETC',         '기타',      'Other FAQ',         8, 1);
