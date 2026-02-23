package org.myweb.uniplace.domain.support.application;

import org.myweb.uniplace.domain.support.api.dto.request.NoticeCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.NoticeResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface NoticeService {

    PageResponse<NoticeResponse> search(NoticeSearchRequest request, Pageable pageable);

    NoticeResponse get(Integer noticeId);

    NoticeResponse create(String userId, NoticeCreateRequest request);

    NoticeResponse update(Integer noticeId, NoticeUpdateRequest request);

    void delete(Integer noticeId);
}

