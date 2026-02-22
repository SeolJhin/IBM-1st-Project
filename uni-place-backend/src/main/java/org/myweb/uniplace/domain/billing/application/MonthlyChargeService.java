package org.myweb.uniplace.domain.billing.application;

import org.myweb.uniplace.domain.billing.api.dto.request.MonthlyChargeCreateRequest;
import org.myweb.uniplace.domain.billing.api.dto.response.BillingOrderResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;

import java.util.List;

public interface MonthlyChargeService {

    MonthlyChargeResponse create(MonthlyChargeCreateRequest request);

    List<MonthlyChargeResponse> getByContract(Integer contractId);

    MonthlyChargeDetailResponse getDetail(Integer chargeId);

    BillingOrderResponse createOrder(Integer chargeId);
}
