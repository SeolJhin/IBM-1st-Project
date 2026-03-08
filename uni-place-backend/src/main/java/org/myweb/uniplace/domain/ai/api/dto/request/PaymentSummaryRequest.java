package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class PaymentSummaryRequest {

    private String userId;
    private String month;
    private String paymentId;
    private Integer totalPrice;
    private String paidAt;
    private String targetType;

    public AiIntent getIntent() {
        return AiIntent.PAYMENT_SUMMARY_DOCUMENT;
    }
}
