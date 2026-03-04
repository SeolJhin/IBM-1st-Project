// 경로: org/myweb/uniplace/domain/review/application/ReviewLikeServiceImpl.java
package org.myweb.uniplace.domain.review.application;

import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.review.domain.entity.Review;
import org.myweb.uniplace.domain.review.domain.entity.ReviewLike;
import org.myweb.uniplace.domain.review.repository.ReviewLikeRepository;
import org.myweb.uniplace.domain.review.repository.ReviewRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewLikeServiceImpl implements ReviewLikeService {

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final NotificationService notificationService;

    @Override
    public void likeReview(int reviewId, String userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        ReviewLike.Id id = new ReviewLike.Id(userId, reviewId);
        if (reviewLikeRepository.existsById(id)) return;

        reviewLikeRepository.save(ReviewLike.builder().id(id).build());

        // 본인 리뷰가 아닐 때만 알림
        if (!userId.equals(review.getUserId())) {
            notificationService.notifyUser(
                    review.getUserId(),
                    "RVW_LIKE",
                    "작성하신 리뷰에 좋아요가 눌렸습니다.",
                    userId,
                    TargetType.review,
                    reviewId,
                    "/reviews/" + reviewId
            );
        }
    }

    @Override
    public void unlikeReview(int reviewId, String userId) {
        ReviewLike.Id id = new ReviewLike.Id(userId, reviewId);
        if (!reviewLikeRepository.existsById(id)) return;
        reviewLikeRepository.deleteById(id);
    }
}
