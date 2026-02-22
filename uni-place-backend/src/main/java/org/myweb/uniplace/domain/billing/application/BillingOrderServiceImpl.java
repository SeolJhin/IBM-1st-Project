package org.myweb.uniplace.domain.billing.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.response.BillingOrderResponse;
import org.myweb.uniplace.domain.billing.domain.entity.BillingOrder;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.BillingOrderRepository;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class BillingOrderServiceImpl implements BillingOrderService {

    private final BillingOrderRepository billingOrderRepository;
    private final MonthlyChargeRepository monthlyChargeRepository;

    @Override
    public BillingOrderResponse createOrderForCharge(Integer chargeId) {
        MonthlyCharge charge = monthlyChargeRepository.findById(chargeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));

        Optional<BillingOrder> existing = billingOrderRepository
                .findTopByChargeIdOrderByOrderIdDesc(chargeId);

        if (existing.isPresent()
                && !BillingOrder.ST_CANCELLED.equals(existing.get().getOrderSt())) {
            return new BillingOrderResponse(existing.get());
        }

        BillingOrder order = BillingOrder.builder()
                .contractId(charge.getContractId())
                .chargeId(charge.getChargeId())
                .amount(charge.getPrice())
                .build();

        return new BillingOrderResponse(billingOrderRepository.save(order));
    }

    @Override
    public BillingOrderResponse markPaid(Integer orderId, Integer paymentId) {
        BillingOrder order = billingOrderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_ORDER_NOT_FOUND));

        order.markPaid(paymentId);

        monthlyChargeRepository.findById(order.getChargeId())
                .ifPresent(charge -> charge.markPaid(paymentId));

        return new BillingOrderResponse(order);
    }
}
