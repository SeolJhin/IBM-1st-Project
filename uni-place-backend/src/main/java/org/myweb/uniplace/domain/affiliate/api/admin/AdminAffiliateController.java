package org.myweb.uniplace.domain.affiliate.api.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateCreateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateSearchRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateUpdateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateResponse;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateSummaryResponse;
import org.myweb.uniplace.domain.affiliate.application.AffiliateService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/affiliates")
public class AdminAffiliateController {

    private final AffiliateService affiliateService;

    @GetMapping
    public ApiResponse<PageResponse<AffiliateSummaryResponse>> search(
            @ModelAttribute AffiliateSearchRequest request,
            @PageableDefault(size = 20, sort = "affiliateId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(affiliateService.search(request, pageable));
    }

    @PostMapping
    public ApiResponse<AffiliateResponse> create(@Valid @RequestBody AffiliateCreateRequest request) {
        return ApiResponse.ok(affiliateService.create(request));
    }

    @PatchMapping("/{affiliateId}")
    public ApiResponse<AffiliateResponse> update(
            @PathVariable("affiliateId") Integer affiliateId,
            @Valid @RequestBody AffiliateUpdateRequest request
    ) {
        return ApiResponse.ok(affiliateService.update(affiliateId, request));
    }

    @GetMapping("/{affiliateId}")
    public ApiResponse<AffiliateResponse> detail(@PathVariable("affiliateId") Integer affiliateId) {
        return ApiResponse.ok(affiliateService.get(affiliateId));
    }
}
