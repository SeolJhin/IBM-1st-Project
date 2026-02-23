// 경로: org/myweb/uniplace/domain/review/api/ReviewController.java
package org.myweb.uniplace.domain.review.api;

import java.util.List;

import org.myweb.uniplace.domain.review.api.dto.request.ReviewCreateRequest;
import org.myweb.uniplace.domain.review.api.dto.request.ReviewUpdateRequest;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewRoomSummaryResponse;
import org.myweb.uniplace.domain.review.application.ReviewService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    // ─────────────────────────────────────────────────────────────────────
    // [GET] /reviews?roomId={roomId}&page=0&size=10
    // 방별 리뷰 목록 (게시판형 페이징, 최신순)
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> reviewList(
            @RequestParam(required = false) Integer roomId,
            @PageableDefault(size = 10, sort = "reviewId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        // roomId 누락 시 명확한 400 반환
        if (roomId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getReviewListByRoom(roomId, pageable))
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // [GET] /reviews/my?page=0&size=10
    // 내 리뷰 목록 (로그인 필요)
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> myReviews(
            @PageableDefault(size = 10, sort = "reviewId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getMyReviews(pageable))
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // [GET] /reviews/{reviewId}
    // 리뷰 상세 (파일 포함)
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> reviewDetail(
            @PathVariable int reviewId
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getReviewDetail(reviewId))
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // [GET] /reviews/rooms/{roomId}/summary
    // 방별 별점 요약 (평균·건수)
    // ─────────────────────────────────────────────────────────────────────
    @GetMapping("/rooms/{roomId}/summary")
    public ResponseEntity<ApiResponse<ReviewRoomSummaryResponse>> roomSummary(
            @PathVariable Integer roomId
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getRoomReviewSummary(roomId))
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // [POST] /reviews
    // 리뷰 등록 (multipart: 필드 + 이미지 파일 다중)
    // form-data: reviewTitle, reviewCtnt, rating, roomId, code, ofiles[]
    // ─────────────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> reviewCreate(
            @Valid @ModelAttribute ReviewCreateRequest request,
            @RequestParam(name = "ofiles", required = false) List<MultipartFile> files
    ) {
        reviewService.createReview(request, files);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─────────────────────────────────────────────────────────────────────
    // [PUT] /reviews/{reviewId}
    // 리뷰 수정 (본인만)
    // form-data: 수정 필드 + deleteFiles(boolean) + ofiles[]
    // ─────────────────────────────────────────────────────────────────────
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> reviewUpdate(
            @PathVariable int reviewId,
            @ModelAttribute ReviewUpdateRequest request,
            @RequestParam(defaultValue = "false") boolean deleteFiles,
            @RequestParam(name = "ofiles", required = false) List<MultipartFile> files
    ) {
        reviewService.updateReview(reviewId, request, deleteFiles, files);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─────────────────────────────────────────────────────────────────────
    // [DELETE] /reviews/{reviewId}
    // 리뷰 삭제 (본인만)
    // ─────────────────────────────────────────────────────────────────────
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> reviewDelete(
            @PathVariable int reviewId
    ) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}