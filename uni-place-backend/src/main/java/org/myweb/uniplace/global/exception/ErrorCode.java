package org.myweb.uniplace.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== AUTH / USER =====
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U001", "이미 사용 중인 이메일입니다."),
    DUPLICATE_TEL(HttpStatus.CONFLICT, "U002", "이미 사용 중인 전화번호입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U003", "사용자를 찾을 수 없습니다."),
    USER_INACTIVE(HttpStatus.FORBIDDEN, "U004", "비활성/차단된 계정입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "U005", "이메일 또는 비밀번호가 올바르지 않습니다."),

    REFRESH_TOKEN_REQUIRED(HttpStatus.BAD_REQUEST, "A001", "리프레시 토큰이 필요합니다."),
    DEVICE_ID_REQUIRED(HttpStatus.BAD_REQUEST, "A002", "deviceId가 필요합니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "A003", "리프레시 토큰이 유효하지 않습니다."),
    REFRESH_TOKEN_REVOKED(HttpStatus.UNAUTHORIZED, "A004", "폐기된 리프레시 토큰입니다."),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A005", "만료된 리프레시 토큰입니다."),
    DEVICE_MISMATCH(HttpStatus.UNAUTHORIZED, "A006", "디바이스 정보가 일치하지 않습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "A007", "토큰이 유효하지 않습니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A008", "토큰이 만료되었습니다."),
    TOKEN_REUSE_DETECTED(HttpStatus.UNAUTHORIZED, "A009", "토큰 재사용이 감지되었습니다. 전체 로그아웃 처리됩니다."),

    // ===== COMMON =====
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C500", "서버 오류가 발생했습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String code, String message) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.message = message;
    }
}
