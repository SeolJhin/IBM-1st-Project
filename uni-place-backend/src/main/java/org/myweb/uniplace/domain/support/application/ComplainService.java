package org.myweb.uniplace.domain.support.application;

import org.myweb.uniplace.domain.support.api.dto.request.ComplainCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainReplyRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.ComplainResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ComplainService {

    /** 관리자 전체 민원 목록 */
    PageResponse<ComplainResponse> search(ComplainSearchRequest request, Pageable pageable);

    /** 본인 민원 목록 */
    PageResponse<ComplainResponse> getMyList(String userId, Pageable pageable);

    ComplainResponse get(Integer compId);

    ComplainResponse create(String userId, ComplainCreateRequest request);

    ComplainResponse update(Integer compId, ComplainUpdateRequest request);

    /** 관리자 상태 변경 */
    ComplainResponse updateStatus(Integer compId, ComplainUpdateRequest request);

    /** 관리자 답변 처리: reply_ck='Y' + 상태 변경 */
    ComplainResponse createReply(Integer compId, ComplainReplyRequest request);

    void delete(Integer compId);
}

