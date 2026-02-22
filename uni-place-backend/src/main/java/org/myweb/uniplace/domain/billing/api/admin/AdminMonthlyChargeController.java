package org.myweb.uniplace.domain.billing.api.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.billing.api.dto.request.MonthlyChargeCreateRequest;
import org.myweb.uniplace.domain.billing.api.dto.response.MonthlyChargeResponse;
import org.myweb.uniplace.domain.billing.application.MonthlyChargeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/monthly-charges")
public class AdminMonthlyChargeController {

    private final MonthlyChargeService monthlyChargeService;

    @PostMapping
    public ResponseEntity<ApiResponse<MonthlyChargeResponse>> create(
            @Valid @RequestBody MonthlyChargeCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                monthlyChargeService.create(request)
        ));
    }
}
