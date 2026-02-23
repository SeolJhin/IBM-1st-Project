// 경로: org/myweb/uniplace/domain/notification/domain/enums/NotificationType.java
package org.myweb.uniplace.domain.notification.domain.enums;

public enum NotificationType {

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

    // ===== admin/system =====
    ADMIN_NOTICE
}