// 경로: org/myweb/uniplace/domain/review/api/ReviewLikeController.java
package org.myweb.uniplace.domain.review.api;

import org.myweb.uniplace.domain.review.application.ReviewLikeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reviews")
public class ReviewLikeController {

    private final ReviewLikeService reviewLikeService;

    // POST /reviews/{reviewId}/likes  → 좋아요
    @PostMapping("/{reviewId}/likes")
    public ResponseEntity<ApiResponse<Void>> like(
            @PathVariable("reviewId") int reviewId,
            @AuthenticationPrincipal AuthUser user
    ) {
        reviewLikeService.likeReview(reviewId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // DELETE /reviews/{reviewId}/likes  → 좋아요 취소
    @DeleteMapping("/{reviewId}/likes")
    public ResponseEntity<ApiResponse<Void>> unlike(
            @PathVariable("reviewId") int reviewId,
            @AuthenticationPrincipal AuthUser user
    ) {
        reviewLikeService.unlikeReview(reviewId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
