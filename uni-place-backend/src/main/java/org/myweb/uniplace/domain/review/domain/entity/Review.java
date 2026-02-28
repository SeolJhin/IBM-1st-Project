// 경로: org/myweb/uniplace/domain/review/domain/entity/Review.java
package org.myweb.uniplace.domain.review.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_review_user_room",
        columnNames = {"user_id", "room_id"}
    )
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id", nullable = false)
    private Integer reviewId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "room_id", nullable = false)
    private Integer roomId;

    /** 별점 1~5 */
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "review_title", length = 100)
    private String reviewTitle;

    @Column(name = "review_ctnt", length = 3000)
    private String reviewCtnt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "code", nullable = true, length = 20)
    private String code;

    /** 파일(썸네일/이미지) 존재 여부: 'Y'/'N' */
    @Column(name = "file_ck", nullable = false, columnDefinition = "CHAR(1)")
    private String fileCk;

    /** 답글 존재 여부: 'Y'/'N' */
    @Column(name = "reply_ck", nullable = false, columnDefinition = "CHAR(1)")
    private String replyCk;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (fileCk == null) fileCk = "N";
        if (replyCk == null) replyCk = "N";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── 도메인 메서드 (Setter 대신 의미있는 메서드로만 변경 허용) ────────

    public void update(Integer rating, String reviewTitle, String reviewCtnt, String code) {
        if (rating != null) this.rating = rating;
        if (reviewTitle != null) this.reviewTitle = reviewTitle;
        if (reviewCtnt != null) this.reviewCtnt = reviewCtnt;
        if (code != null) this.code = code;
    }

    public void markFile(boolean hasFile) {
        this.fileCk = hasFile ? "Y" : "N";
    }

    public void markReply(boolean hasReply) {
        this.replyCk = hasReply ? "Y" : "N";
    }
}
