package org.myweb.uniplace.domain.billing.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.request.MonthlyChargeCreateRequest;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
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
    private final ContractRepository contractRepository;

    @Override
    public MonthlyChargeResponse create(MonthlyChargeCreateRequest request) {
        if (request == null
                || request.getContractId() == null
                || request.getPrice() == null
                || request.getChargeType() == null || request.getChargeType().isBlank()
                || request.getBillingDt() == null || request.getBillingDt().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (!contractRepository.existsById(request.getContractId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        monthlyChargeRepository.findByContractIdAndBillingDtAndChargeType(
                request.getContractId(),
                request.getBillingDt(),
                request.getChargeType()
        ).ifPresent(existing -> {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        });

        MonthlyCharge charge = MonthlyCharge.builder()
                .contractId(request.getContractId())
                .chargeType(request.getChargeType())
                .billingDt(request.getBillingDt())
                .price(request.getPrice())
                .build();

        return new MonthlyChargeResponse(monthlyChargeRepository.save(charge));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonthlyChargeResponse> getByContract(String userId, Integer contractId) {
        assertContractOwnership(userId, contractId);

        return monthlyChargeRepository.findByContractIdOrderByBillingDtDesc(contractId)
                .stream()
                .map(MonthlyChargeResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MonthlyChargeDetailResponse getDetail(String userId, Integer chargeId) {
        MonthlyCharge charge = monthlyChargeRepository.findById(chargeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));
        assertContractOwnership(userId, charge.getContractId());
        return new MonthlyChargeDetailResponse(charge);
    }

    private void assertContractOwnership(String userId, Integer contractId) {
        if (userId == null || userId.isBlank() || contractId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        boolean owner = contractRepository.existsByContractIdAndUser_UserId(contractId, userId);
        if (!owner) {
            throw new BusinessException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
    }
}
