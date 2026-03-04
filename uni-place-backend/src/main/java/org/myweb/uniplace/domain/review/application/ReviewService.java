// 경로: org/myweb/uniplace/domain/review/application/ReviewService.java
package org.myweb.uniplace.domain.review.application;

import java.util.List;

import org.myweb.uniplace.domain.review.api.dto.request.ReviewCreateRequest;
import org.myweb.uniplace.domain.review.api.dto.request.ReviewUpdateRequest;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewRoomSummaryResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface ReviewService {

    /** 전체 리뷰 목록 (커뮤니티 후기탭용) */
    PageResponse<ReviewResponse> getAllReviews(Pageable pageable);

    /** 방별 리뷰 목록 (게시판형 페이징) */
    PageResponse<ReviewResponse> getReviewListByRoom(Integer roomId, Pageable pageable);

    /** 내 리뷰 목록 */
    PageResponse<ReviewResponse> getMyReviews(Pageable pageable);

    /** 리뷰 상세 (increaseReadCount=true 면 조회수 +1 후 반환) */
    ReviewResponse getReviewDetail(int reviewId, boolean increaseReadCount);

    /** 리뷰 등록 (썸네일 포함 다중 이미지 업로드 가능) */
    void createReview(ReviewCreateRequest request, List<MultipartFile> files);

    /** 리뷰 수정 */
    void updateReview(int reviewId, ReviewUpdateRequest request, boolean deleteFiles, List<MultipartFile> files);

    /** 리뷰 삭제 (본인만) */
    void deleteReview(int reviewId);

    /** 방별 평균 별점 + 리뷰 수 요약 */
    ReviewRoomSummaryResponse getRoomReviewSummary(Integer roomId);
}
