-- V5__add_face_descriptor.sql
-- 얼굴 인식 로그인용 descriptor 저장 테이블
-- 실제 벡터는 암호화하여 저장, 로그인 실패 횟수 관리 포함

CREATE TABLE IF NOT EXISTS face_descriptor (
  face_id        BIGINT        AUTO_INCREMENT PRIMARY KEY,
  user_id        VARCHAR(50)   NOT NULL,
  descriptor     TEXT          NOT NULL COMMENT '128차원 float 벡터 JSON (AES 암호화)',
  fail_count     INT           NOT NULL DEFAULT 0 COMMENT '연속 실패 횟수',
  locked_until   DATETIME      NULL     COMMENT '잠금 해제 시각',
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NULL     ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_face_user (user_id),
  CONSTRAINT fk_face_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='얼굴 인식 로그인 descriptor';