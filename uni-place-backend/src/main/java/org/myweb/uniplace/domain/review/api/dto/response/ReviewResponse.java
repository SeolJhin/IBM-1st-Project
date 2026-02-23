// 경로: org/myweb/uniplace/domain/review/api/dto/response/ReviewResponse.java
package org.myweb.uniplace.domain.review.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.review.domain.entity.Review;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Integer reviewId;
    private String userId;
    private Integer roomId;

    /** 별점 1~5 */
    private Integer rating;

    private String reviewTitle;
    private String reviewCtnt;

    private String code;
    private String fileCk;
    private String replyCk;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 파일(이미지) 목록.
     * - 목록 API: 썸네일 1장만 포함
     * - 상세 API: 전체 파일 포함
     */
    private List<FileResponse> files;

    /**
     * 썸네일 URL: files 중 첫 번째 이미지의 viewUrl.
     * fileCk='N' 이거나 이미지 파일이 없으면 null.
     */
    private String thumbnailUrl;

    // ─── 방/건물 요약 정보 ─────────────────────────────────────────────
    private Integer buildingId;
    private String buildingNm;
    private Integer roomNo;

    /** 파일 없는 버전 (목록에서 파일 따로 로드할 때 사용) */
    public static ReviewResponse fromEntity(Review e, List<FileResponse> files) {
        return ReviewResponse.builder()
                .reviewId(e.getReviewId())
                .userId(e.getUserId())
                .roomId(e.getRoomId())
                .rating(e.getRating())
                .reviewTitle(e.getReviewTitle())
                .reviewCtnt(e.getReviewCtnt())
                .code(e.getCode())
                .fileCk(e.getFileCk())
                .replyCk(e.getReplyCk())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .files(files)
                .thumbnailUrl(resolveThumbnail(files))
                .build();
    }

    /** 방 정보까지 채우는 버전 */
    public static ReviewResponse fromEntity(Review e, List<FileResponse> files, Room room) {
        ReviewResponse base = fromEntity(e, files);

        if (room == null) return base;

        return base.toBuilder()
                .buildingId(room.getBuilding() != null ? room.getBuilding().getBuildingId() : null)
                .buildingNm(room.getBuilding() != null ? room.getBuilding().getBuildingNm() : null)
                .roomNo(room.getRoomNo())
                .build();
    }

    /** 파일 없이 (엔티티만) */
    public static ReviewResponse fromEntity(Review e) {
        return fromEntity(e, null);
    }

    /** 이미지 확장자인 첫 번째 파일의 viewUrl 반환 */
    private static String resolveThumbnail(List<FileResponse> files) {
        if (files == null || files.isEmpty()) return null;
        List<String> imageExts = List.of(".png", ".jpg", ".jpeg", ".gif", ".webp");
        return files.stream()
                .filter(f -> f.getFileType() != null
                        && imageExts.contains(f.getFileType().toLowerCase()))
                .map(FileResponse::getViewUrl)
                .findFirst()
                .orElse(null);
    }
}