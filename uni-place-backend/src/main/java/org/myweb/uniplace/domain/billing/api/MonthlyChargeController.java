package org.myweb.uniplace.domain.billing.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeDetailResponse;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.application.MonthlyChargeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/monthly-charges")
public class MonthlyChargeController {

    private final MonthlyChargeService monthlyChargeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MonthlyChargeResponse>>> listByContract(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam("contractId") Integer contractId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.getByContract(authUser.getUserId(), contractId)
        ));
    }

    @GetMapping("/{chargeId}")
    public ResponseEntity<ApiResponse<MonthlyChargeDetailResponse>> detail(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Integer chargeId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.getDetail(authUser.getUserId(), chargeId)
        ));
    }
}
