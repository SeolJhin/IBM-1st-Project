package org.myweb.uniplace.domain.affiliate.application;

import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateCreateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateSearchRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.request.AffiliateUpdateRequest;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateResponse;
import org.myweb.uniplace.domain.affiliate.api.dto.response.AffiliateSummaryResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AffiliateService {

    PageResponse<AffiliateSummaryResponse> search(AffiliateSearchRequest request, Pageable pageable);

    AffiliateResponse get(Integer affiliateId);

    // 관리자
    AffiliateResponse create(AffiliateCreateRequest request);
    AffiliateResponse update(Integer affiliateId, AffiliateUpdateRequest request);
    void delete(Integer affiliateId);
}
