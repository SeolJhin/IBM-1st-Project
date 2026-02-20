package org.myweb.uniplace.domain.system.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.application.CompanyInfoService;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/company-info")
public class CompanyInfoController {

    private final CompanyInfoService companyInfoService;

    @GetMapping
    public ApiResponse<CompanyInfoResponse> getLatest() {
        return ApiResponse.ok(companyInfoService.getLatest());
    }
}