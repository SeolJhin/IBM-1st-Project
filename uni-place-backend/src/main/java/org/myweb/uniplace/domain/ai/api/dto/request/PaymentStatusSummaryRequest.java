package org.myweb.uniplace.domain.ai.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class PaymentStatusSummaryRequest {

    private String userId;
    private String billingMonth;
    private String paymentSt;
    private String chargeStatus;
    private String dueDate;

    public AiIntent getIntent() {
        return AiIntent.PAYMENT_STATUS_SUMMARY;
    }
}
