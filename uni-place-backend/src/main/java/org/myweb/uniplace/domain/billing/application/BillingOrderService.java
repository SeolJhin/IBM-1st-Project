package org.myweb.uniplace.domain.billing.application;

import org.myweb.uniplace.domain.billing.api.dto.response.BillingOrderResponse;

public interface BillingOrderService {

    BillingOrderResponse createOrderForCharge(Integer chargeId);

    BillingOrderResponse markPaid(Integer orderId, Integer paymentId);
}
