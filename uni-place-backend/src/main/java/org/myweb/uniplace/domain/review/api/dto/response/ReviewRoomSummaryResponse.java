// 경로: org/myweb/uniplace/domain/review/api/dto/response/ReviewRoomSummaryResponse.java
package org.myweb.uniplace.domain.review.api.dto.response;

import lombok.*;

/**
 * 방별 리뷰 통계 요약 응답 DTO
 * - 평균 별점, 리뷰 수 제공
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewRoomSummaryResponse {

    private Integer roomId;

    /** 평균 별점 (소수점 1자리 반올림) */
    private double avgRating;

    /** 리뷰 총 건수 */
    private long reviewCount;
}