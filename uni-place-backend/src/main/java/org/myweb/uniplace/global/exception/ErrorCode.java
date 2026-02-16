package org.myweb.uniplace.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== Common =====
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C000", "서버 오류가 발생했습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "C001", "잘못된 요청입니다."),

    // ===== Auth / Security =====
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A401", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A403", "권한이 없습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "A410", "유효하지 않은 토큰입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A411", "만료된 토큰입니다."),
    TOKEN_TYPE_MISMATCH(HttpStatus.UNAUTHORIZED, "A412", "토큰 타입이 올바르지 않습니다."),

    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "A420", "리프레시 토큰을 찾을 수 없습니다."),
    REFRESH_TOKEN_REVOKED(HttpStatus.UNAUTHORIZED, "A421", "폐기된 리프레시 토큰입니다."),
    REFRESH_TOKEN_REUSED(HttpStatus.UNAUTHORIZED, "A422", "리프레시 토큰 재사용이 감지되었습니다. 전체 로그아웃 처리됩니다."),

    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "A430", "이메일 또는 비밀번호가 올바르지 않습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
