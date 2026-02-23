// 경로: org/myweb/uniplace/domain/review/application/AdminReviewService.java
package org.myweb.uniplace.domain.review.application;

import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AdminReviewService {

    /** 전체 리뷰 목록 (관리자) */
    PageResponse<ReviewResponse> getAllReviews(Pageable pageable);

    /** 관리자 리뷰 삭제 */
    void deleteReviewAsAdmin(int reviewId);
}