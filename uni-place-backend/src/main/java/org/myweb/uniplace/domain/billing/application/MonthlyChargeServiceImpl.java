package org.myweb.uniplace.domain.billing.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.request.MonthlyChargeCreateRequest;
import org.myweb.uniplace.domain.billing.api.dto.response.BillingOrderResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MonthlyChargeServiceImpl implements MonthlyChargeService {

    private final MonthlyChargeRepository monthlyChargeRepository;
    private final BillingOrderService billingOrderService;

    @Override
    public MonthlyChargeResponse create(MonthlyChargeCreateRequest request) {
        MonthlyCharge charge = MonthlyCharge.builder()
                .contractId(request.getContractId())
                .chargeType(request.getChargeType())
                .billingDt(request.getBillingDt())
                .price(request.getPrice())
                .chargeSt(request.getChargeSt())
                .paymentId(request.getPaymentId())
                .build();

        return new MonthlyChargeResponse(monthlyChargeRepository.save(charge));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthlyChargeResponse> getByContract(Integer contractId) {
        return monthlyChargeRepository.findByContractIdOrderByBillingDtDesc(contractId)
                .stream()
                .map(MonthlyChargeResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MonthlyChargeDetailResponse getDetail(Integer chargeId) {
        MonthlyCharge charge = monthlyChargeRepository.findById(chargeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
        return new MonthlyChargeDetailResponse(charge);
    }

    @Override
    public BillingOrderResponse createOrder(Integer chargeId) {
        return billingOrderService.createOrderForCharge(chargeId);
    }
}
