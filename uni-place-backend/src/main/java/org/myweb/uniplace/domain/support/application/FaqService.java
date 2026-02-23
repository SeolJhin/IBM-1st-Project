package org.myweb.uniplace.domain.support.application;

import org.myweb.uniplace.domain.support.api.dto.request.FaqCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.FaqResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface FaqService {

    PageResponse<FaqResponse> search(FaqSearchRequest request, Pageable pageable);

    FaqResponse get(Integer faqId);

    // 관리자
    FaqResponse create(FaqCreateRequest request);

    FaqResponse update(Integer faqId, FaqUpdateRequest request);

    void delete(Integer faqId);
}

