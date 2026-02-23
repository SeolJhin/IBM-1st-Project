package org.myweb.uniplace.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== Auth / Security =====
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH_401", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH_403", "접근 권한이 없습니다."),

    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_410", "토큰이 유효하지 않습니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_411", "토큰이 만료되었습니다."),
    TOKEN_TYPE_INVALID(HttpStatus.UNAUTHORIZED, "AUTH_412", "토큰 타입이 올바르지 않습니다."),
    REFRESH_TOKEN_REVOKED(HttpStatus.UNAUTHORIZED, "AUTH_413", "리프레시 토큰이 폐기되었습니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "AUTH_414", "리프레시 토큰을 찾을 수 없습니다."),
    TOKEN_REUSE_DETECTED(HttpStatus.UNAUTHORIZED, "AUTH_415",
        "리프레시 토큰 재사용이 감지되었습니다. 전체 로그아웃 처리됩니다."),

    // ===== User =====
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_404", "사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "USER_409_1", "이미 사용 중인 이메일입니다."),
    DUPLICATE_TEL(HttpStatus.CONFLICT, "USER_409_2", "이미 사용 중인 전화번호입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "USER_400_1", "비밀번호가 올바르지 않습니다."),

    // ===== Common =====
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "COMMON_400", "잘못된 요청입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_500", "서버 오류가 발생했습니다."),

    // ===== System (Company/Banner) =====
    COMPANY_INFO_NOT_FOUND(HttpStatus.NOT_FOUND, "SYSTEM_404_1", "회사 정보를 찾을 수 없습니다."),
    BANNER_NOT_FOUND(HttpStatus.NOT_FOUND, "SYSTEM_404_2", "배너를 찾을 수 없습니다."),

    // ===== Affiliate =====
    AFFILIATE_NOT_FOUND(HttpStatus.NOT_FOUND, "AFFILIATE_404", "제휴업체를 찾을 수 없습니다."),
    AFFILIATE_DUPLICATE(HttpStatus.CONFLICT, "AFFILIATE_409", "이미 등록된 제휴업체입니다."),

    // ===== Product =====
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "PRODUCT_404", "상품을 찾을 수 없습니다."),

    // ===== Room =====
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "ROOM_404", "방을 찾을 수 없습니다."),

    // ===== Order =====
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_404", "주문을 찾을 수 없습니다."),
    ORDER_CANNOT_CANCEL(HttpStatus.BAD_REQUEST, "ORDER_400_1", "취소할 수 없는 주문 상태입니다."),
    ORDER_ACCESS_DENIED(HttpStatus.FORBIDDEN, "ORDER_403", "해당 주문에 접근 권한이 없습니다."),

    // ===== Payment =====
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAYMENT_404", "결제 정보를 찾을 수 없습니다."),
    PAYMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "PAYMENT_403", "해당 결제에 접근 권한이 없습니다."),
    PAYMENT_ALREADY_PAID(HttpStatus.BAD_REQUEST, "PAYMENT_400_1", "이미 결제 완료된 건입니다."),
    PAYMENT_ALREADY_CANCELED(HttpStatus.BAD_REQUEST, "PAYMENT_400_2", "이미 취소된 결제입니다."),
    PAYMENT_INVALID_TARGET(HttpStatus.BAD_REQUEST, "PAYMENT_400_3", "결제 대상 정보가 올바르지 않습니다."),
    PAYMENT_REFUND_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "PAYMENT_400_4", "환불할 수 없는 결제 상태입니다."),
    PAYMENT_REFUND_INVALID_AMOUNT(HttpStatus.BAD_REQUEST, "PAYMENT_400_5", "환불 금액이 올바르지 않습니다."),
    PAYMENT_GATEWAY_ERROR(HttpStatus.BAD_GATEWAY, "PAYMENT_502", "외부 결제사 처리 중 오류가 발생했습니다."),

    // ===== Support =====
    QNA_NOT_FOUND(HttpStatus.NOT_FOUND, "QNA_404", "QnA 게시글을 찾을 수 없습니다."),
    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTICE_404", "공지사항을 찾을 수 없습니다."),
    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "FAQ_404", "FAQ를 찾을 수 없습니다."),
    COMPLAIN_NOT_FOUND(HttpStatus.NOT_FOUND, "COMPLAIN_404", "민원을 찾을 수 없습니다."),

    // ===== Billing =====
    BILLING_CHARGE_NOT_FOUND(HttpStatus.NOT_FOUND, "BILLING_404_1", "청구(월세/관리비) 정보를 찾을 수 없습니다."),
    BILLING_ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "BILLING_404_2", "청구 결제 주문을 찾을 수 없습니다."),
    BILLING_CHARGE_ALREADY_PAID(HttpStatus.BAD_REQUEST, "BILLING_400_1", "이미 납부 처리된 청구입니다."),
    BILLING_ORDER_ALREADY_PAID(HttpStatus.BAD_REQUEST, "BILLING_400_2", "이미 결제 완료된 주문입니다."),

    // ===== RoomServiceOrder =====
    ROOM_SERVICE_ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "RSO_404", "룸서비스 주문을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
