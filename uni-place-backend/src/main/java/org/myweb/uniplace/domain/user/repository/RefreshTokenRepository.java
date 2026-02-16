package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    long deleteByExpiresAtBefore(LocalDateTime time);

    @Modifying
    @Query("""
        update RefreshToken rt
           set rt.revoked = true,
               rt.revokedAt = :now
         where rt.user.userId = :userId
           and rt.revoked = false
    """)
    int revokeAllActiveByUserId(String userId, LocalDateTime now);
}
