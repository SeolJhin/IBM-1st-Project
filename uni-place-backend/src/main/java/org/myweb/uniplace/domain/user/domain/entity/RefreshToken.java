package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "refresh_tokens",
    uniqueConstraints = @UniqueConstraint(name = "uq_refresh_token_hash", columnNames = "token_hash"),
    indexes = {
        @Index(name = "ix_refresh_tokens_user", columnList = "user_id"),
        @Index(name = "ix_refresh_tokens_device", columnList = "user_id, device_id"),
        @Index(name = "ix_refresh_tokens_expires", columnList = "expires_at")
    }
)
public class RefreshToken {

    @Id
    @Column(name = "refresh_token_id", length = 36)
    private String refreshTokenId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_refresh_tokens_user"))
    private User user;

    @Column(name = "token_hash", length = 64, nullable = false)
    private String tokenHash;

    @Column(name = "device_id", length = 100, nullable = false)
    private String deviceId;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public void revokeNow() {
        this.revoked = true;
        this.revokedAt = LocalDateTime.now();
    }

    public void markLastUsedNow() {
        this.lastUsedAt = LocalDateTime.now();
    }
}
