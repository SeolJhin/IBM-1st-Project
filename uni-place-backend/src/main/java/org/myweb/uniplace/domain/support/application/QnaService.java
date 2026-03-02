package org.myweb.uniplace.domain.support.application;

import org.myweb.uniplace.domain.support.api.dto.request.*;
import org.myweb.uniplace.domain.support.api.dto.response.QnaResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface QnaService {

    /** 사용자 본인 질문 목록 */
    PageResponse<QnaResponse> search(
            QnaSearchRequest request,
            Pageable pageable,
            String requesterUserId,
            boolean isAdmin
    );

    /** 관리자 전체 질문 목록 */
    PageResponse<QnaResponse> searchAll(QnaSearchRequest request, Pageable pageable);

    /** 질문 상세 */
    QnaResponse get(Integer qnaId, String requesterUserId, boolean isAdmin);

    /** 질문의 답변 목록 */
    List<QnaResponse> getReplies(Integer qnaId, String requesterUserId, boolean isAdmin);

    /** 질문 등록 */
    QnaResponse create(String userId, QnaCreateRequest request);

    /** 질문 수정 */
    QnaResponse update(Integer qnaId, QnaUpdateRequest request);

    /** 질문 삭제 */
    void delete(Integer qnaId);

    /** 관리자 답변 등록 */
    QnaResponse createAnswer(Integer qnaId, String adminUserId, QnaAnswerRequest request);

    /** 관리자 답변 수정 */
    QnaResponse updateAnswer(Integer qnaId, QnaAnswerRequest request);

    /** QNA 상태 변경 (관리자) */
    QnaResponse updateStatus(Integer qnaId, QnaStatusUpdateRequest request);
}
