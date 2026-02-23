// 경로: org/myweb/uniplace/domain/review/api/admin/AdminReviewController.java
package org.myweb.uniplace.domain.review.api.admin;

import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.application.AdminReviewService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    // ─────────────────────────────────────────────────────────────────────
    // [GET] /admin/reviews?page=0&size=20
    // 전체 리뷰 목록 조회 (관리자)
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> adminReviewList(
            @PageableDefault(size = 20, sort = "reviewId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(adminReviewService.getAllReviews(pageable))
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // [DELETE] /admin/reviews/{reviewId}
    // 관리자 리뷰 강제 삭제
    // ─────────────────────────────────────────────────────────────────────
    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteReview(
            @PathVariable int reviewId
    ) {
        adminReviewService.deleteReviewAsAdmin(reviewId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}