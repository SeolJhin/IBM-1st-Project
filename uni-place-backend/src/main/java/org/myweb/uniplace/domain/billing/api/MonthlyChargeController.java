package org.myweb.uniplace.domain.billing.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.response.BillingOrderResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.application.MonthlyChargeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/monthly-charges")
public class MonthlyChargeController {

    private final MonthlyChargeService monthlyChargeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyChargeResponse>>> listByContract(
            @RequestParam("contractId") Integer contractId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.getByContract(contractId)
        ));
    }

    @GetMapping("/{chargeId}")
    public ResponseEntity<ApiResponse<MonthlyChargeDetailResponse>> detail(
            @PathVariable Integer chargeId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.getDetail(chargeId)
        ));
    }

    @PostMapping("/{chargeId}/orders")
    public ResponseEntity<ApiResponse<BillingOrderResponse>> createOrder(
            @PathVariable Integer chargeId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.createOrder(chargeId)
        ));
    }
}
