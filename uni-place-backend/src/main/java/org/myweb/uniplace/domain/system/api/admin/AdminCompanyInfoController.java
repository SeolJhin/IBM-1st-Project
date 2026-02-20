package org.myweb.uniplace.domain.system.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.application.CompanyInfoService;
import org.myweb.uniplace.domain.system.api.dto.request.CompanyInfoUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/company-info")
public class AdminCompanyInfoController {

    private final CompanyInfoService companyInfoService;

    @PatchMapping("/{companyId}")
    public ApiResponse<CompanyInfoResponse> update(
            @PathVariable Integer companyId,
            @RequestBody CompanyInfoUpdateRequest request
    ) {
        return ApiResponse.ok(companyInfoService.update(companyId, request));
    }
}