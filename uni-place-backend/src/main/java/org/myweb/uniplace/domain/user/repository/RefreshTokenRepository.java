package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

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
    int revokeAllActiveByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);
}
