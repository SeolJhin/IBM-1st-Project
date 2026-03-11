package org.myweb.uniplace.domain.ai.api.dto.request;

import java.util.List;
import java.util.Map;
import lombok.Getter;
import org.myweb.uniplace.domain.ai.domain.AiIntent;

@Getter
public class PaymentOrderFormCreateRequest {

    private String userId;
    private Integer buildingId;
    private String month;
    private Boolean approved;
    private List<Map<String, Object>> approvedItems;
    private List<Map<String, Object>> items;
    private String orderDate;
    private String orderNo;
    private String supplierName;
    private String supplierContact;

    public AiIntent getIntent() {
        return AiIntent.PAYMENT_ORDER_FORM_CREATE;
    }
}
