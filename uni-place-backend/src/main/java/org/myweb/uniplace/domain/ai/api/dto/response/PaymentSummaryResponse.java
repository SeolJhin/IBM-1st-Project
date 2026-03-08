package org.myweb.uniplace.domain.ai.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.application.gateway.dto.AiGatewayResponse;

@Getter
@Builder
public class PaymentSummaryResponse {

    private String summary;
    private Double confidence;

    public static PaymentSummaryResponse from(AiGatewayResponse response) {
        if (response == null) {
            return PaymentSummaryResponse.builder().build();
        }
        return PaymentSummaryResponse.builder()
            .summary(response.getAnswer())
            .confidence(response.getConfidence())
            .build();
    }
}
