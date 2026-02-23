// 경로: org/myweb/uniplace/domain/review/application/ReviewServiceImpl.java
package org.myweb.uniplace.domain.review.application;

import java.util.Collections;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.review.api.dto.request.ReviewCreateRequest;
import org.myweb.uniplace.domain.review.api.dto.request.ReviewUpdateRequest;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewRoomSummaryResponse;
import org.myweb.uniplace.domain.review.domain.entity.Review;
import org.myweb.uniplace.domain.review.repository.ReviewRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private static final String FILE_PARENT_TYPE = "REVIEW";

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final FileService fileService;
    private final NotificationService notificationService;

    // ─────────────────────────────────────────────────────────────────────
    // 조회
    // ─────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewListByRoom(Integer roomId, Pageable pageable) {
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findByRoomIdOrderByReviewIdDesc(roomId, pageReq);

        // 목록에서는 roomId가 모두 동일하므로 Room을 한 번만 조회
        Room room = roomRepository.findById(roomId).orElse(null);

        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = loadThumbnailOnly(r);
            return ReviewResponse.fromEntity(r, files, room);
        });

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Pageable pageable) {
        String userId = requireCurrentUserId();
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findByUserIdOrderByReviewIdDesc(userId, pageReq);

        // 내 리뷰는 방이 각각 다를 수 있으므로 건별 조회
        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = loadThumbnailOnly(r);
            Room room = roomRepository.findById(r.getRoomId()).orElse(null);
            return ReviewResponse.fromEntity(r, files, room);
        });

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewDetail(int reviewId) {
        Review review = findReviewOrThrow(reviewId);

        List<FileResponse> files = null;
        if ("Y".equalsIgnoreCase(review.getFileCk())) {
            files = fileService.getActiveFiles(FILE_PARENT_TYPE, reviewId);
        }

        Room room = roomRepository.findById(review.getRoomId()).orElse(null);

        return ReviewResponse.fromEntity(review, files, room);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewRoomSummaryResponse getRoomReviewSummary(Integer roomId) {
        double avg = reviewRepository.avgRatingByRoomId(roomId);
        long count = reviewRepository.countByRoomId(roomId);
        double rounded = Math.round(avg * 10.0) / 10.0;

        return ReviewRoomSummaryResponse.builder()
                .roomId(roomId)
                .avgRating(rounded)
                .reviewCount(count)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    // 등록
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void createReview(ReviewCreateRequest request, List<MultipartFile> files) {
        String userId = requireCurrentUserId();

        // 방 존재 여부 확인
        if (!roomRepository.existsById(request.getRoomId())) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

        // 중복 작성 체크 → 409
        if (reviewRepository.existsByUserIdAndRoomId(userId, request.getRoomId())) {
            throw new BusinessException(ErrorCode.REVIEW_DUPLICATE);
        }

        Review review = Review.builder()
                .userId(userId)
                .roomId(request.getRoomId())
                .rating(request.getRating())
                .reviewTitle(request.getReviewTitle())
                .reviewCtnt(request.getReviewCtnt())
                .code(request.getCode())
                .build();

        Review saved = reviewRepository.save(review);

        boolean hasFile = uploadFiles(saved.getReviewId(), files);
        saved.markFile(hasFile);
        saved.markReply(false);

        // ✅ 알림: 관리자에게 새 리뷰 등록 알림
        notificationService.notifyAdmins(
                NotificationType.RVW_NEW,
                "새 리뷰가 등록되었습니다. (roomId=" + request.getRoomId() + ", 별점=" + request.getRating() + "★)",
                userId,
                TargetType.review,
                saved.getReviewId(),
                "/admin/reviews"
        );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 수정
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void updateReview(int reviewId, ReviewUpdateRequest request, boolean deleteFiles, List<MultipartFile> files) {
        String me = requireCurrentUserId();
        Review review = findReviewOrThrow(reviewId);

        if (!me.equals(review.getUserId())) {
            throw new BusinessException(ErrorCode.REVIEW_ACCESS_DENIED);
        }

        review.update(request.getRating(), request.getReviewTitle(), request.getReviewCtnt(), request.getCode());

        if (deleteFiles) {
            softDeleteAllFiles(reviewId);
            review.markFile(false);
        }

        if (hasValidFiles(files)) {
            softDeleteAllFiles(reviewId);
            boolean uploaded = uploadFiles(reviewId, files);
            review.markFile(uploaded);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // 삭제
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void deleteReview(int reviewId) {
        String me = requireCurrentUserId();
        Review review = findReviewOrThrow(reviewId);

        if (!me.equals(review.getUserId())) {
            throw new BusinessException(ErrorCode.REVIEW_ACCESS_DENIED);
        }

        softDeleteAllFiles(reviewId);
        reviewRepository.deleteById(reviewId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // helpers
    // ─────────────────────────────────────────────────────────────────────

    private List<FileResponse> loadThumbnailOnly(Review r) {
        if (!"Y".equalsIgnoreCase(r.getFileCk())) return Collections.emptyList();

        List<FileResponse> all = fileService.getActiveFiles(FILE_PARENT_TYPE, r.getReviewId());
        if (all == null || all.isEmpty()) return Collections.emptyList();

        List<String> imageExts = List.of(".png", ".jpg", ".jpeg", ".gif", ".webp");
        return all.stream()
                .filter(f -> f.getFileType() != null
                        && imageExts.contains(f.getFileType().toLowerCase()))
                .limit(1)
                .toList();
    }

    private boolean uploadFiles(Integer reviewId, List<MultipartFile> files) {
        if (!hasValidFiles(files)) return false;

        FileUploadRequest req = FileUploadRequest.builder()
                .fileParentType(FILE_PARENT_TYPE)
                .fileParentId(reviewId)
                .files(files)
                .build();

        fileService.uploadFiles(req);
        return true;
    }

    private void softDeleteAllFiles(Integer reviewId) {
        List<FileResponse> existing = fileService.getActiveFiles(FILE_PARENT_TYPE, reviewId);
        if (existing != null && !existing.isEmpty()) {
            List<Integer> ids = existing.stream().map(FileResponse::getFileId).toList();
            fileService.softDeleteFilesByParent(FILE_PARENT_TYPE, reviewId, ids);
        }
    }

    private boolean hasValidFiles(List<MultipartFile> files) {
        return files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty());
    }

    private Review findReviewOrThrow(int reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
    }

    private String requireCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        Object p = auth.getPrincipal();
        if (p instanceof AuthUser au) return au.getUserId();
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
}