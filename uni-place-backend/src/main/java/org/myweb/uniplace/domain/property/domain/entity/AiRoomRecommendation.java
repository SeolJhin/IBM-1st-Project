// 경로: org/myweb/uniplace/domain/property/domain/entity/AiRoomRecommendation.java
package org.myweb.uniplace.domain.property.domain.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * AI 홈 방 추천 Top3 이력 엔티티
 * - 매일 자정 @Scheduled 또는 관리자 수동 갱신 시 새 레코드가 insert 됨
 * - 최신 generated_at 기준 rank_no 1·2·3 을 홈 화면에 표시
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_room_recommendation")
public class AiRoomRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rec_id", nullable = false)
    private Integer recId;

    /** 추천 대상 방 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    /** 추천 순위 (1·2·3) */
    @Column(name = "rank_no", nullable = false)
    private Integer rankNo;

    /** AI가 생성한 추천 이유 (한국어 1~2문장) */
    @Column(name = "ai_reason", length = 500)
    private String aiReason;

    /** 집계 시점 평균 평점 */
    @Column(name = "avg_rating", precision = 3, scale = 2)
    private BigDecimal avgRating;

    /** 집계 시점 리뷰 수 */
    @Column(name = "review_count")
    private Integer reviewCount;

    /** 집계 시점 활성 계약 수 */
    @Column(name = "contract_count")
    private Integer contractCount;

    /** 추천 생성 시각 */
    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    public void prePersist() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
