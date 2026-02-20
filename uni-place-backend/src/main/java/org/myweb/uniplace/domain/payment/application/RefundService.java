package org.myweb.uniplace.domain.payment.application;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentRefundRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentRefundResponse;

public interface RefundService {

    PaymentRefundResponse refund(PaymentRefundRequest request);
}