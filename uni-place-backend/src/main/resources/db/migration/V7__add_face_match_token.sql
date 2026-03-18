-- V6__add_face_match_token.sql
-- 얼굴 매칭 세션 토큰 저장 (다중 서버 대응)
-- matchToken은 10분 TTL, 1회용

CREATE TABLE face_match_token (
  token       VARCHAR(64)  PRIMARY KEY,
  user_ids    TEXT         NOT NULL COMMENT 'JSON 배열: ["userId1","userId2"]',
  expire_at   DATETIME     NOT NULL,
  used        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='얼굴 인식 매칭 세션 토큰 (10분 TTL)';

CREATE INDEX ix_face_match_token_expire ON face_match_token (expire_at);
