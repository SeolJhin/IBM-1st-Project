// 경로: org/myweb/uniplace/domain/review/api/dto/response/ReviewResponse.java
package org.myweb.uniplace.domain.review.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.review.domain.entity.Review;
import org.myweb.uniplace.domain.user.domain.entity.User;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Integer reviewId;
    private String userId;         // 표시용 (닉네임 or userId)
    private String realUserId;     // 본인 여부 판단용 실제 userId
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

    /** 방 정보까지 채우는 버전 */
    public static ReviewResponse fromEntity(Review e, List<FileResponse> files, Room room, User author) {
        Integer buildingId = null;
        String buildingNm  = null;
        Integer roomNo     = null;

        if (room != null) {
            roomNo = room.getRoomNo();
            if (room.getBuilding() != null) {
                buildingId = room.getBuilding().getBuildingId();
                buildingNm = room.getBuilding().getBuildingNm();
            }
        }

        String displayName = (author != null && author.getUserNickname() != null && !author.getUserNickname().isBlank())
                ? author.getUserNickname()
                : e.getUserId();

        return ReviewResponse.builder()
                .reviewId(e.getReviewId())
                .userId(displayName)
                .realUserId(e.getUserId())
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
                .buildingId(buildingId)
                .buildingNm(buildingNm)
                .roomNo(roomNo)
                .build();
    }

    /** 방 정보까지 채우는 버전 (author 없음, 하위 호환) */
    public static ReviewResponse fromEntity(Review e, List<FileResponse> files, Room room) {
        return fromEntity(e, files, room, null);
    }

    /** 파일 없는 버전 */
    public static ReviewResponse fromEntity(Review e, List<FileResponse> files) {
        return fromEntity(e, files, null, null);
    }

    /** 파일 없이 (엔티티만) */
    public static ReviewResponse fromEntity(Review e) {
        return fromEntity(e, null, null, null);
    }

    /** 이미지 확장자인 첫 번째 파일의 viewUrl 반환 */
    private static String resolveThumbnail(List<FileResponse> files) {
        if (files == null || files.isEmpty()) return null;
        List<String> imageExts = List.of(".png", ".jpg", ".jpeg", ".gif", ".webp");
        return files.stream()
                .filter(f -> {
                    if (f.getFileType() == null) return false;
                    String t = f.getFileType().toLowerCase();
                    return imageExts.contains(t) || t.startsWith("image/");
                })
                .map(FileResponse::getViewUrl)
                .findFirst()
                .orElse(null);
    }
}