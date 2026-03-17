package org.myweb.uniplace.domain.payment.application;

import org.myweb.uniplace.domain.payment.api.dto.request.PaymentApproveRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareMonthlyBatchRequest;
import org.myweb.uniplace.domain.payment.api.dto.request.PaymentPrepareRequest;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentPrepareResponse;
import org.myweb.uniplace.domain.payment.api.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentPrepareResponse prepare(String userId, PaymentPrepareRequest request);

    PaymentPrepareResponse prepareMonthlyChargeBatch(String userId, PaymentPrepareMonthlyBatchRequest request);

    PaymentResponse approve(String userId, PaymentApproveRequest request);

    PaymentResponse approveFromCallback(PaymentApproveRequest request);

    void recordReturnedParams(Integer paymentId, String returnedParamsJson);

    void cancelFromCallback(Integer paymentId, String merchantUid);

    void failFromCallback(Integer paymentId, String merchantUid, String failCode, String failMessage);

    /** 사용자가 결제창 이탈(뒤로가기)로 결제 포기 — payment cancelled, order cancelled */
    void abandonByUser(String userId, Integer paymentId);

    PaymentResponse retry(String userId, Integer paymentId);
}