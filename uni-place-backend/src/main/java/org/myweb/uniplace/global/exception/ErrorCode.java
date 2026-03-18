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
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "USER_409_3", "이미 사용 중인 닉네임입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "USER_400_1", "비밀번호가 올바르지 않습니다."),
    PASSWORD_RESET_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "USER_400_2", "유효하지 않은 재설정 링크입니다."),
    PASSWORD_RESET_TOKEN_EXPIRED(HttpStatus.BAD_REQUEST, "USER_400_3", "재설정 링크가 만료되었습니다. 다시 요청해주세요."),
    EMAIL_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "USER_400_4", "이메일 인증을 완료해주세요."),
    EMAIL_CODE_INVALID(HttpStatus.BAD_REQUEST, "USER_400_5", "인증코드가 올바르지 않거나 만료되었습니다."),
    EMAIL_CODE_COOLDOWN(HttpStatus.TOO_MANY_REQUESTS, "USER_429_1", "잠시 후 다시 시도해주세요. (60초 후 재발송 가능)"),

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
    PRODUCT_SOLD_OUT(HttpStatus.CONFLICT, "PRODUCT_409_1", "품절된 상품입니다."),
    PRODUCT_OUT_OF_STOCK(HttpStatus.CONFLICT, "PRODUCT_409_2", "상품 재고가 부족합니다."),

    // ===== Room =====
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "ROOM_404", "방을 찾을 수 없습니다."),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "CONTRACT_404", "계약을 찾을 수 없습니다."),
    CONTRACT_INVALID_PERIOD(HttpStatus.BAD_REQUEST, "CONTRACT_400_1", "계약 종료일은 시작일로부터 최소 7일 이후여야 합니다."),
    CONTRACT_OVERLAP(HttpStatus.BAD_REQUEST, "CONTRACT_400_2", "이미 진행 중이거나 기간이 겹치는 계약이 있어 이중 계약을 진행할 수 없습니다."),

    // ===== Order =====
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_404", "주문을 찾을 수 없습니다."),
    ORDER_CANNOT_CANCEL(HttpStatus.BAD_REQUEST, "ORDER_400_1", "취소할 수 없는 주문 상태입니다."),
    ORDER_ACCESS_DENIED(HttpStatus.FORBIDDEN, "ORDER_403", "해당 주문에 접근 권한이 없습니다."),
    ORDER_INVALID_STATUS(HttpStatus.BAD_REQUEST, "ORDER_400_2", "해당 주문 상태에서는 룸서비스를 요청할 수 없습니다."),

    // ===== Payment =====
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "PAYMENT_404", "결제 정보를 찾을 수 없습니다."),
    PAYMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "PAYMENT_403", "해당 결제에 접근 권한이 없습니다."),
    PAYMENT_ALREADY_PAID(HttpStatus.BAD_REQUEST, "PAYMENT_400_1", "이미 결제 완료된 건입니다."),
    PAYMENT_ALREADY_CANCELED(HttpStatus.BAD_REQUEST, "PAYMENT_400_2", "이미 취소된 결제입니다."),
    PAYMENT_INVALID_TARGET(HttpStatus.BAD_REQUEST, "PAYMENT_400_3", "결제 대상 정보가 올바르지 않습니다."),
    PAYMENT_REFUND_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "PAYMENT_400_4", "환불할 수 없는 결제 상태입니다."),
    PAYMENT_REFUND_INVALID_AMOUNT(HttpStatus.BAD_REQUEST, "PAYMENT_400_5", "환불 금액이 올바르지 않습니다."),
    PAYMENT_GATEWAY_ERROR(HttpStatus.BAD_GATEWAY, "PAYMENT_502", "외부 결제사 처리 중 오류가 발생했습니다."),

    // ===== Billing =====
    BILLING_CHARGE_NOT_FOUND(HttpStatus.NOT_FOUND, "BILLING_404_1", "청구(월세/관리비) 정보를 찾을 수 없습니다."),
    BILLING_CHARGE_ALREADY_PAID(HttpStatus.BAD_REQUEST, "BILLING_400_1", "이미 납부 처리된 청구입니다."),

    // ===== Support =====
    QNA_NOT_FOUND(HttpStatus.NOT_FOUND, "QNA_404", "QnA 게시글을 찾을 수 없습니다."),
    NOTICE_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTICE_404", "공지사항을 찾을 수 없습니다."),
    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "FAQ_404", "FAQ를 찾을 수 없습니다."),
    COMPLAIN_NOT_FOUND(HttpStatus.NOT_FOUND, "COMPLAIN_404", "민원을 찾을 수 없습니다."),

    // ===== Cart =====
    CART_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_404", "장바구니 항목을 찾을 수 없습니다."),
    CART_NOT_FOUND(HttpStatus.NOT_FOUND, "CART_404_1", "장바구니를 찾을 수 없습니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "FILE_404", "파일을 찾을 수 없습니다."),
    BOARD_NOT_FOUND(HttpStatus.NOT_FOUND, "BOARD_404", "게시글을 찾을 수 없습니다."),
    REPLY_NOT_FOUND(HttpStatus.NOT_FOUND, "REPLY_404", "댓글을 찾을 수 없습니다."),

    // ===== Notification =====
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTI_404", "알림을 찾을 수 없습니다."),
    NOTIFICATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "NOTI_403", "해당 알림에 접근 권한이 없습니다."),

    // ===== Review =====
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "REVIEW_404", "리뷰를 찾을 수 없습니다."),
    REVIEW_DUPLICATE(HttpStatus.CONFLICT, "REVIEW_409", "이미 작성한 리뷰가 있습니다."),
    REVIEW_ACCESS_DENIED(HttpStatus.FORBIDDEN, "REVIEW_403", "해당 리뷰에 접근 권한이 없습니다."),
    REVIEW_TENANT_ONLY(HttpStatus.FORBIDDEN, "REVIEW_403_1", "입주자(tenant)만 리뷰를 작성·수정·삭제할 수 있습니다."),
    REVIEW_NO_CONTRACT(HttpStatus.FORBIDDEN, "REVIEW_403_2", "해당 방의 계약이 활성 중이거나 종료된 이력이 있는 경우에만 리뷰를 작성할 수 있습니다."),


    // ===== Building / Space =====
    BUILDING_NOT_FOUND(HttpStatus.NOT_FOUND, "BUILDING_404", "빌딩을 찾을 수 없습니다."),
    BUILDING_DUPLICATE(HttpStatus.CONFLICT, "BUILDING_409", "이미 같은 이름의 건물이 존재합니다."),
    SPACE_NOT_FOUND(HttpStatus.NOT_FOUND, "SPACE_404", "공용공간을 찾을 수 없습니다."),
    SPACE_BUILDING_MISMATCH(HttpStatus.BAD_REQUEST, "SPACE_400_1", "공용공간이 해당 빌딩에 속하지 않습니다."),
    SPACE_CAPACITY_EXCEEDED(HttpStatus.BAD_REQUEST, "SPACE_400_2", "예약 인원이 공간 수용 인원을 초과합니다."),

    // ===== Tour Reservation =====
    TOUR_RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "TOUR_RSV_404", "방문 예약을 찾을 수 없습니다."),
    TOUR_RESERVATION_INVALID_TIME(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_1", "예약 시간이 올바르지 않습니다."),
    TOUR_RESERVATION_INVALID_SLOT(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_2", "예약 슬롯이 올바르지 않습니다."),
    TOUR_RESERVATION_ROOM_UNAVAILABLE(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_3", "예약 불가능한 방 상태입니다."),
    TOUR_RESERVATION_TIME_CONFLICT(HttpStatus.CONFLICT, "TOUR_RSV_409_1", "이미 예약된 시간대와 겹칩니다."),
    TOUR_RESERVATION_DUPLICATE(HttpStatus.CONFLICT, "TOUR_RSV_409_2", "동일한 연락처로 중복 예약이 존재합니다."),
    TOUR_RESERVATION_ALREADY_CANCELLED(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_4", "이미 취소된 예약입니다."),
    TOUR_RESERVATION_CANNOT_CANCEL(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_5", "취소할 수 없는 예약 상태입니다."),
    TOUR_RESERVATION_BUILDING_ROOM_MISMATCH(HttpStatus.BAD_REQUEST, "TOUR_RSV_400_6", "방이 해당 빌딩에 속하지 않습니다."),

    // ===== Space Reservation =====
    SPACE_RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "SPACE_RSV_404", "공용공간 예약을 찾을 수 없습니다."),
    SPACE_RESERVATION_INVALID_TIME(HttpStatus.BAD_REQUEST, "SPACE_RSV_400_1", "예약 시간이 올바르지 않습니다."),
    SPACE_RESERVATION_INVALID_SLOT(HttpStatus.BAD_REQUEST, "SPACE_RSV_400_2", "예약 슬롯이 올바르지 않습니다."),
    SPACE_RESERVATION_PEOPLE_INVALID(HttpStatus.BAD_REQUEST, "SPACE_RSV_400_3", "예약 인원이 올바르지 않습니다."),
    SPACE_RESERVATION_TIME_CONFLICT(HttpStatus.CONFLICT, "SPACE_RSV_409", "이미 예약된 시간대와 겹칩니다."),
    SPACE_RESERVATION_CANNOT_CANCEL(HttpStatus.BAD_REQUEST, "SPACE_RSV_400_4", "취소할 수 없는 예약 상태입니다."),
    SPACE_RESERVATION_ACCESS_DENIED(HttpStatus.FORBIDDEN, "SPACE_RSV_403", "해당 예약에 접근 권한이 없습니다."),
    SPACE_RESERVATION_TENANT_ONLY(HttpStatus.FORBIDDEN, "SPACE_RSV_403_1", "입주자만 공용공간을 예약할 수 있습니다."),
    SPACE_RESERVATION_USER_INACTIVE(HttpStatus.FORBIDDEN, "SPACE_RSV_403_2", "비활성 상태의 계정은 예약할 수 없습니다."),
    SPACE_RESERVATION_BUILDING_MISMATCH(HttpStatus.FORBIDDEN, "SPACE_RSV_403_3", "해당 건물에 활성 계약이 있는 입주자만 예약할 수 있습니다."),

    // ===== 추가 본 ===========
    INSPECTION_NOT_FOUND(HttpStatus.NOT_FOUND, "INSPECTION_404", "점검 기록을 찾을 수 없습니다."),
    TICKET_NOT_FOUND(HttpStatus.NOT_FOUND, "TICKET_404", "유지보수 티켓을 찾을 수 없습니다."),

    // ===== Face Login =====
    FACE_NOT_REGISTERED(HttpStatus.NOT_FOUND,   "FACE_404",   "등록된 얼굴 정보가 없습니다. 마이페이지에서 먼저 얼굴을 등록해 주세요."),
    FACE_NOT_RECOGNIZED(HttpStatus.UNAUTHORIZED, "FACE_401",   "얼굴을 인식하지 못했습니다. 카메라 정면을 바라보고 다시 시도해 주세요."),
    FACE_ACCOUNT_LOCKED( HttpStatus.TOO_MANY_REQUESTS, "FACE_429", "인식 실패가 반복되어 10분간 잠금되었습니다. 잠시 후 다시 시도해 주세요."),

    // ===== Admin / Tour Reservation =====
    TOUR_STATUS_NOT_FOUND(HttpStatus.NOT_FOUND, "TOUR_ST_404", "해당 투어 예약 상태를 찾을 수 없습니다."),

    // ===== RoomServiceOrder =====
    ROOM_SERVICE_ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "RSO_404", "룸서비스 주문을 찾을 수 없습니다."),
    ROOM_SERVICE_TENANT_ONLY(HttpStatus.FORBIDDEN, "RSO_403_1", "입주자만 룸서비스 주문이 가능합니다.");
	

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}