package org.myweb.uniplace.domain.payment.api.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 룸서비스 주문 상품별 환불 요청 DTO
 */
@Getter
@Setter
public class AdminOrderRefundRequest {

    /** 환불 사유 (필수) */
    private String refundReason;

    /** 재고 원상복구 여부 (true = 선택한 상품 재고 복원) */
    private boolean restoreStock = false;

    /**
     * 환불할 상품 목록.
     * null 또는 빈 리스트이면 전체 환불 (모든 orderItem).
     */
    private List<RefundItem> refundItems;

    @Getter
    @Setter
    public static class RefundItem {
        /** OrderItem ID */
        private Integer orderItemId;
        /** 환불 수량 (null이면 주문 수량 전체) */
        private Integer quantity;
    }
}