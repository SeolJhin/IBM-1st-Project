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

    // [GET] /reviews?roomId={roomId}&page=0&size=10  (roomId 없으면 전체 조회)
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> reviewList(
            @RequestParam(name = "roomId", required = false) Integer roomId,
            @PageableDefault(size = 10, sort = "reviewId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        if (roomId != null) {
            return ResponseEntity.ok(
                    ApiResponse.ok(reviewService.getReviewListByRoom(roomId, pageable))
            );
        }
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getAllReviews(pageable))
        );
    }

    // [GET] /reviews/my?page=0&size=10
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> myReviews(
            @PageableDefault(size = 10, sort = "reviewId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getMyReviews(pageable))
        );
    }

 // [GET] /reviews/{reviewId}?increaseReadCount=true(default)
    @GetMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> reviewDetail(
            @PathVariable("reviewId") int reviewId,
            @RequestParam(name = "increaseReadCount", defaultValue = "true") boolean increaseReadCount
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getReviewDetail(reviewId, increaseReadCount))
        );
    }

    // [GET] /reviews/rooms/{roomId}/summary
    @GetMapping("/rooms/{roomId}/summary")
    public ResponseEntity<ApiResponse<ReviewRoomSummaryResponse>> roomSummary(
            @PathVariable("roomId") Integer roomId
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(reviewService.getRoomReviewSummary(roomId))
        );
    }

    // [POST] /reviews
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> reviewCreate(
            @Valid @ModelAttribute ReviewCreateRequest request,
            @RequestParam(name = "ofiles", required = false) List<MultipartFile> files
    ) {
        reviewService.createReview(request, files);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // [PUT] /reviews/{reviewId}
    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> reviewUpdate(
            @PathVariable("reviewId") int reviewId,
            @ModelAttribute ReviewUpdateRequest request,
            @RequestParam(name = "deleteFiles", defaultValue = "false") boolean deleteFiles,
            @RequestParam(name = "ofiles", required = false) List<MultipartFile> files
    ) {
        reviewService.updateReview(reviewId, request, deleteFiles, files);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // [DELETE] /reviews/{reviewId}
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> reviewDelete(
            @PathVariable("reviewId") int reviewId
    ) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}