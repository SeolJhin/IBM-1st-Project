package org.myweb.uniplace.domain.payment.application;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentPrepareResponse prepare(String userId, PaymentPrepareRequest request);

    PaymentResponse approve(String userId, PaymentApproveRequest request);

    PaymentResponse approveFromCallback(PaymentApproveRequest request);

    void recordReturnedParams(Integer paymentId, String returnedParamsJson);

    void cancelFromCallback(Integer paymentId, String merchantUid);

    void failFromCallback(Integer paymentId, String merchantUid, String failCode, String failMessage);

    PaymentResponse retry(String userId, Integer paymentId);
}
