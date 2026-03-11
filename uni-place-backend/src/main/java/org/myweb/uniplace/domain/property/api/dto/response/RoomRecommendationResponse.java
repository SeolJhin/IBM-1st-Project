// 경로: org/myweb/uniplace/domain/property/api/dto/response/RoomRecommendationResponse.java
package org.myweb.uniplace.domain.property.api.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.property.domain.entity.AiRoomRecommendation;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.property.domain.enums.RoomType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * GET /rooms/recommendations 응답 DTO
 * - AI가 선정한 추천 방 1건 정보 (rank 1·2·3 중 1개)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRecommendationResponse {

    /** 추천 순위 (1·2·3) */
    private Integer rankNo;

    /** 방 ID */
    private Integer roomId;

    /** 건물명 */
    private String buildingNm;

    /** 건물 주소 */
    private String buildingAddr;

    /** 방 타입 (one_room / two_room / …) */
    private RoomType roomType;

    /** 월 임대료 */
    private BigDecimal rentPrice;

    /** 층수 */
    private Integer floor;

    /** AI 추천 이유 (한국어) */
    private String aiReason;

    /** 평균 평점 */
    private BigDecimal avgRating;

    /** 리뷰 수 */
    private Integer reviewCount;

    /** 활성 계약 수 */
    private Integer contractCount;

    /** 썸네일 URL (파일 서버에서 채울 경우 사용, 현재는 null) */
    private String thumbnailUrl;

    /** 추천 생성 시각 */
    private LocalDateTime generatedAt;

    /** Entity → DTO 변환 */
    public static RoomRecommendationResponse fromEntity(AiRoomRecommendation rec) {
        Room     room = rec.getRoom();
        Building b    = room != null ? room.getBuilding() : null;

        return RoomRecommendationResponse.builder()
                .rankNo(rec.getRankNo())
                .roomId(room != null ? room.getRoomId() : null)
                .buildingNm(b != null ? b.getBuildingNm() : null)
                .buildingAddr(b != null ? b.getBuildingAddr() : null)
                .roomType(room != null ? room.getRoomType() : null)
                .rentPrice(room != null ? room.getRentPrice() : null)
                .floor(room != null ? room.getFloor() : null)
                .aiReason(rec.getAiReason())
                .avgRating(rec.getAvgRating())
                .reviewCount(rec.getReviewCount())
                .contractCount(rec.getContractCount())
                .thumbnailUrl(null)   // 필요 시 파일 서버 URL로 교체
                .generatedAt(rec.getGeneratedAt())
                .build();
    }
}
