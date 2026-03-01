package org.myweb.uniplace.domain.billing.api.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.request.MonthlyChargeCreateRequest;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.application.MonthlyChargeService;
import org.myweb.uniplace.domain.billing.domain.entity.MonthlyCharge;
import org.myweb.uniplace.domain.billing.repository.MonthlyChargeRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/monthly-charges")
public class AdminMonthlyChargeController {

    private final MonthlyChargeService monthlyChargeService;
    private final MonthlyChargeRepository monthlyChargeRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyChargeResponse>>> list(
            @RequestParam(value = "contractId", required = false) Integer contractId
    ) {
        List<MonthlyCharge> charges = contractId == null
                ? monthlyChargeRepository.findAll().stream()
                .sorted(Comparator.comparing(MonthlyCharge::getChargeId).reversed())
                .toList()
                : monthlyChargeRepository.findByContractIdOrderByBillingDtDesc(contractId);

        List<MonthlyChargeResponse> data = charges.stream()
                .map(MonthlyChargeResponse::new)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{chargeId}")
    public ResponseEntity<ApiResponse<MonthlyChargeDetailResponse>> detail(
            @PathVariable("chargeId") Integer chargeId
    ) {
        MonthlyCharge charge = monthlyChargeRepository.findById(chargeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BILLING_CHARGE_NOT_FOUND));

        return ResponseEntity.ok(ApiResponse.ok(new MonthlyChargeDetailResponse(charge)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MonthlyChargeResponse>> create(
            @Valid @RequestBody MonthlyChargeCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.create(request)
        ));
    }
}
