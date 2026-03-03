// 경로: org/myweb/uniplace/domain/notification/domain/enums/NotificationType.java
package org.myweb.uniplace.domain.notification.domain.enums;

public enum NotificationType {

    // ===== contract =====
    CONTRACT_REQ,   // 계약 신청 (관리자 수신)
    CONTRACT_CFM,   // 계약 승인 (유저 수신)
    CONTRACT_CAN,   // 계약 취소/반려 (유저 수신)

    // ===== support (QnA / 민원) =====
    QNA_NEW,        // QnA 질문 접수 (관리자 수신)
    QNA_ANSWERED,   // QnA 답변 등록 (질문자 수신)
    COMP_NEW,       // 민원 접수 (관리자 수신)
    COMP_REPLIED,   // 민원 답변 (민원인 수신)

    // ===== room service / order =====
    ORDER_NEW,      // 룸서비스 주문 접수 (관리자 수신)
    ORDER_STATUS,   // 룸서비스 주문 상태변경 (유저 수신)

    // ===== billing =====
    BILL_NEW,       // 월 청구서 생성 (유저 수신)

    // ===== community =====
    BRD_LIKE,       // 게시글 좋아요
    RPL_LIKE,       // 댓글 좋아요
    BRD_REPLY,      // 내 글에 댓글
    BRD_REREPLY,    // 내 댓글에 대댓글

    ADM_BRD_DEL,    // 관리자: 게시글 삭제
    ADM_RPL_DEL,    // 관리자: 댓글 삭제
    ADM_BRD_IMP,    // 관리자: 중요공지 설정

    // ===== review =====
    RVW_NEW,        // 새 리뷰 등록 (관리자 수신)
    ADM_RVW_DEL,    // 관리자: 리뷰 삭제 (작성자 수신)

    // ===== reservation(space) =====
    SP_REQ,         // 공간예약 접수
    SP_CFM,         // 공간예약 확정
    SP_CAN,         // 공간예약 취소
    SP_REM,         // 공간예약 리마인드

    // ===== reservation(tour) =====
    TOUR_REQ,       // 투어예약 접수(관리자)
    TOUR_CFM,       // 투어예약 확정(관리자)
    TOUR_CAN,       // 투어예약 취소(관리자)
    TOUR_REM,       // 투어예약 리마인드(관리자)

    // ===== payment =====
    PAY_OK,         // 결제 성공
    PAY_FAIL,       // 결제 실패
    PAY_RETRY,      // 결제 재시도
    PAY_REFUND,     // 결제 환불
    PAY_STATUS_ADMIN, // 관리자에 의한 결제 상태 변경
    PAY_WEBHOOK_FAIL, // webhook 검증/처리 실패
    PAY_DUPLICATE,    // 중복 결제/거래 식별자 충돌
    PAY_STATUS_MISMATCH, // 결제 상태/금액/통화 불일치
    PAY_BATCH_FAIL,   // 배치/리컨실 처리 실패

    // ===== security/account =====
    SEC_NEW_DEVICE,   // 새 기기 로그인
    SEC_EMAIL_CHG,    // 이메일 변경
    SEC_TEL_CHG,      // 휴대폰 변경
    SEC_PWD_CHG,      // 비밀번호 변경
    SEC_LOGIN_LOCK,   // 로그인 실패 누적 잠금
    SEC_SOCIAL_LINK,  // 소셜 계정 연동

    // ===== admin security =====
    ADM_LOGIN_OK,        // 관리자 로그인 성공
    ADM_NEW_DEVICE,      // 관리자 새 기기 로그인
    ADM_LOGIN_LOCK,      // 관리자 로그인 실패 누적 잠금
    ADM_USER_ROLE_CHG,   // 관리자 회원 권한 변경
    ADM_USER_STATUS_CHG, // 관리자 회원 상태 변경
    ADM_BULK_USER_CHANGE, // 대량 회원 상태/권한 변경
    ADM_ABNORMAL_TRAFFIC, // 로그인 실패 급증
    ADM_ABNORMAL_API,     // 비정상 API 접근 감지

    // ===== admin/system =====
    ADMIN_NOTICE
}
