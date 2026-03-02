package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "ix_prt_token", columnList = "token"),
        @Index(name = "ix_prt_user_id", columnList = "user_id")
})
public class PasswordResetToken {

    @Id
    @Column(name = "id", length = 50, nullable = false)
    private String id;

    /** users.user_id FK (직접 문자열로 저장, 조인 불필요) */
    @Column(name = "user_id", length = 50, nullable = false)
    private String userId;

    /** UUID 기반 무작위 토큰 (URL-safe) */
    @Column(name = "token", length = 100, nullable = false, unique = true)
    private String token;

    /** 만료 일시 (기본 30분) */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** 사용 여부 */
    @Column(name = "used", nullable = false)
    private boolean used;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public void markUsed() {
        this.used = true;
    }
}
