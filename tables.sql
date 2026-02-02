CREATE TABLE users (
    user_id VARCHAR(50) NOT NULL COMMENT '유저 아이디',
    user_name VARCHAR(50) NOT NULL COMMENT '유저 이름',
    user_email VARCHAR(100) NOT NULL COMMENT '유저 이메일',
    user_pwd VARCHAR(255) NOT NULL COMMENT '유저 패스워드',
    user_birth DATE NOT NULL COMMENT '유저 생년월일',
    user_tel VARCHAR(20) NOT NULL COMMENT '유저 전화번호',
    user_role ENUM('admin', 'host', 'tenant') NOT NULL DEFAULT 'host' COMMENT '유저 권한',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜',
    user_status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active' COMMENT '유저 상태',
    
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_user_email (user_email)
) COMMENT='회원정보';
/* SQL 문 Git 연습*/