// 경로: org/myweb/uniplace/domain/review/application/ReviewLikeService.java
package org.myweb.uniplace.domain.review.application;

public interface ReviewLikeService {

    /** 좋아요 등록 (이미 있으면 무시) */
    void likeReview(int reviewId, String userId);

    /** 좋아요 취소 (없으면 무시) */
    void unlikeReview(int reviewId, String userId);
}
