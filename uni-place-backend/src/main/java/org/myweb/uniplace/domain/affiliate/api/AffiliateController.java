package org.myweb.uniplace.domain.affiliate.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateSearchRequest;
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
@RequestMapping("/affiliates")
public class AffiliateController {

    private final AffiliateService affiliateService;

    @GetMapping
    public ApiResponse<PageResponse<AffiliateSummaryResponse>> search(
            @ModelAttribute AffiliateSearchRequest request,
            @PageableDefault(size = 10, sort = "affiliateId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(affiliateService.search(request, pageable));
    }

    @GetMapping("/{affiliateId}")
    public ApiResponse<AffiliateResponse> detail(@PathVariable Integer affiliateId) {
        return ApiResponse.ok(affiliateService.get(affiliateId));
    }
}
