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
import org.myweb.uniplace.domain.review.domain.entity.ReviewLike;
import org.myweb.uniplace.domain.review.repository.ReviewLikeRepository;
import org.myweb.uniplace.domain.review.repository.ReviewRepository;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
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
    private final ReviewLikeRepository reviewLikeRepository;
    private final RoomRepository roomRepository;
    private final FileService fileService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────────
    // 조회
    // ─────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getAllReviews(Pageable pageable) {
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findAllByOrderByReviewIdDesc(pageReq);

        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = loadThumbnailOnly(r);
            Room room = roomRepository.findById(r.getRoomId()).orElse(null);
            User author = userRepository.findById(r.getUserId()).orElse(null);
            return ReviewResponse.fromEntity(r, files, room, author);
        });

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewListByRoom(Integer roomId, Pageable pageable) {
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findByRoomIdOrderByReviewIdDesc(roomId, pageReq);

        Room room = roomRepository.findById(roomId).orElse(null);

        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = loadThumbnailOnly(r);
            User author = userRepository.findById(r.getUserId()).orElse(null);
            return ReviewResponse.fromEntity(r, files, room, author);
        });

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Pageable pageable) {
        String userId = requireCurrentUserId();
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findByUserIdOrderByReviewIdDesc(userId, pageReq);

        User author = userRepository.findById(userId).orElse(null);
        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = loadThumbnailOnly(r);
            Room room = roomRepository.findById(r.getRoomId()).orElse(null);
            return ReviewResponse.fromEntity(r, files, room, author);
        });

        return PageResponse.of(mapped);
    }

    @Override
    @Transactional
    public ReviewResponse getReviewDetail(int reviewId, boolean increaseReadCount) {
        Review review = findReviewOrThrow(reviewId);

        // 조회수 증가 + 응답에 즉시 반영 (DB flush 후 재조회 없이 +1 계산)
        int currentReadCount = review.getReadCount();
        if (increaseReadCount) {
            reviewRepository.incrementReadCount(reviewId);
            currentReadCount++;
        }

        // 좋아요 수 & 본인 좋아요 여부
        long likeCount = reviewLikeRepository.countByIdReviewId(reviewId);
        String currentUserId = currentUserIdOrNull();
        boolean likedByMe = currentUserId != null
                && reviewLikeRepository.existsByIdUserIdAndIdReviewId(currentUserId, reviewId);

        List<FileResponse> files = null;
        if ("Y".equalsIgnoreCase(review.getFileCk())) {
            files = fileService.getActiveFiles(FILE_PARENT_TYPE, reviewId);
        }

        Room room = roomRepository.findById(review.getRoomId()).orElse(null);
        User author = userRepository.findById(review.getUserId()).orElse(null);

        String displayName = (author != null
                && author.getUserNickname() != null
                && !author.getUserNickname().isBlank())
                ? author.getUserNickname()
                : review.getUserId();

        Integer buildingId = null;
        String buildingNm = null;
        Integer roomNo = null;
        if (room != null) {
            roomNo = room.getRoomNo();
            if (room.getBuilding() != null) {
                buildingId = room.getBuilding().getBuildingId();
                buildingNm = room.getBuilding().getBuildingNm();
            }
        }

        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .userId(displayName)
                .realUserId(review.getUserId())
                .roomId(review.getRoomId())
                .rating(review.getRating())
                .reviewTitle(review.getReviewTitle())
                .reviewCtnt(review.getReviewCtnt())
                .code(review.getCode())
                .fileCk(review.getFileCk())
                .replyCk(review.getReplyCk())
                .readCount(currentReadCount)
                .likeCount(likeCount)
                .likedByMe(likedByMe)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .files(files)
                .thumbnailUrl(ReviewResponse.resolveThumbnail(files))
                .buildingId(buildingId)
                .buildingNm(buildingNm)
                .roomNo(roomNo)
                .build();
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
        requireTenantRole();

        Room reviewRoom = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (reviewRoom.isDeleted()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_FOUND);
        }

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

        notificationService.notifyAdmins(
                NotificationType.RVW_NEW.name(),
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
        requireTenantRole();
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
        requireTenantRole();
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
                .filter(f -> {
                    if (f.getFileType() == null) return false;
                    String t = f.getFileType().toLowerCase();
                    return imageExts.contains(t) || t.startsWith("image/");
                })
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

    /** 로그인 중이면 userId, 비로그인이면 null (좋아요 여부 판단용) */
    private String currentUserIdOrNull() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return null;
            Object p = auth.getPrincipal();
            if (p instanceof AuthUser au) return au.getUserId();
        } catch (Exception ignored) {}
        return null;
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

    private void requireTenantRole() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);
        boolean isTenant = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"));
        if (!isTenant) throw new BusinessException(ErrorCode.REVIEW_TENANT_ONLY);
    }
}