package org.myweb.uniplace.domain.ai.api.dto.request;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class PaymentOrderSuggestionRequest {

    private String userId;
    private Integer buildingId;
    private String month;
    private List<Map<String, Object>> items;

    public AiIntent getIntent() {
        return AiIntent.PAYMENT_ORDER_SUGGESTION;
    }
}
