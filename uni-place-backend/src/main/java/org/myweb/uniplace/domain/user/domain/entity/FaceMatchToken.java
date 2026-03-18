package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "face_match_token")
public class FaceMatchToken {

    @Id
    @Column(name = "token", length = 64, nullable = false)
    private String token;

    /** JSON 배열: ["userId1", "userId2"] */
    @Column(name = "user_ids", nullable = false, columnDefinition = "TEXT")
    private String userIds;

    @Column(name = "expire_at", nullable = false)
    private LocalDateTime expireAt;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isExpired() {
        return used || LocalDateTime.now().isAfter(expireAt);
    }

    public void markUsed() {
        this.used = true;
    }
}