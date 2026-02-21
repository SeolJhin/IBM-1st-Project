package org.myweb.uniplace.domain.payment.application;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentPrepareResponse prepare(PaymentPrepareRequest request);

    PaymentResponse approve(PaymentApproveRequest request);

    PaymentResponse retry(Integer paymentId);
}