// 경로: org/myweb/uniplace/domain/review/application/AdminReviewServiceImpl.java
package org.myweb.uniplace.domain.review.application;

import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.repository.RoomRepository;
import org.myweb.uniplace.domain.review.api.dto.response.ReviewResponse;
import org.myweb.uniplace.domain.review.domain.entity.Review;
import org.myweb.uniplace.domain.review.repository.ReviewRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminReviewServiceImpl implements AdminReviewService {

    private static final String FILE_PARENT_TYPE = "REVIEW";

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final FileService fileService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getAllReviews(Pageable pageable) {
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Review> page = reviewRepository.findAllByOrderByReviewIdDesc(pageReq);

        Page<ReviewResponse> mapped = page.map(r -> {
            List<FileResponse> files = null;
            if ("Y".equalsIgnoreCase(r.getFileCk())) {
                files = fileService.getAllFilesForAdmin(FILE_PARENT_TYPE, r.getReviewId());
            }
            Room room = roomRepository.findById(r.getRoomId()).orElse(null);
            return ReviewResponse.fromEntity(r, files, room);
        });

        return PageResponse.of(mapped);
    }

    @Override
    public void deleteReviewAsAdmin(int reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        String writerId = review.getUserId();

        // ✅ 알림은 삭제 전에 먼저 발송
        notificationService.notifyUser(
                writerId,
                NotificationType.ADM_RVW_DEL.name(),
                "관리자 정책에 의해 리뷰가 삭제되었습니다.",
                null,
                TargetType.review,
                reviewId,
                "/reviews"
        );
        notificationService.notifyAdmins(
                NotificationType.ADM_RVW_DEL.name(),
                "관리자 리뷰 삭제 처리 (reviewId=" + reviewId + ")",
                null,
                TargetType.review,
                reviewId,
                "/admin/reviews"
        );

        // 파일 소프트 삭제 → 리뷰 삭제
        List<FileResponse> existing = fileService.getAllFilesForAdmin(FILE_PARENT_TYPE, reviewId);
        if (existing != null && !existing.isEmpty()) {
            List<Integer> ids = existing.stream().map(FileResponse::getFileId).toList();
            fileService.softDeleteFilesByParent(FILE_PARENT_TYPE, reviewId, ids);
        }

        reviewRepository.deleteById(reviewId);
    }
}