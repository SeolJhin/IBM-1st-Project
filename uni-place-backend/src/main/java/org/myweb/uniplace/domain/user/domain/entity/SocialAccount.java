package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "social_accounts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_oauth_provider_user", columnNames = {"provider", "provider_user_id"})
        },
        indexes = {
                @Index(name = "ix_oauth_user", columnList = "user_id")
        }
)
public class SocialAccount { // 이메일이 없어도(카카오) provider_user_id로 내부 user와 1:1로 연결 가능

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "social_account_id")
    private Integer socialAccountId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_oauth_user")
    )
    private User user;

    // DB: ENUM('KAKAO','NAVER','GOOGLE')
    @Column(name = "provider", length = 20, nullable = false)
    private String provider;

    @Column(name = "provider_user_id", length = 50, nullable = false)
    private String providerUserId;

    @Column(name = "provider_email", length = 255)
    private String providerEmail;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
