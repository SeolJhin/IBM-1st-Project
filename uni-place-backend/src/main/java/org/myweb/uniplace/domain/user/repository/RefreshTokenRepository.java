package org.myweb.uniplace.domain.user.repository;

import jakarta.persistence.LockModeType;
import org.myweb.uniplace.domain.user.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select rt
          from RefreshToken rt
         where rt.tokenHash = :tokenHash
    """)
    Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

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

    @Modifying
    @Query("""
        update RefreshToken rt
           set rt.revoked = true,
               rt.revokedAt = :now
         where rt.user.userId = :userId
           and rt.deviceId = :deviceId
           and rt.revoked = false
    """)
    int revokeActiveByUserIdAndDeviceId(@Param("userId") String userId,
                                        @Param("deviceId") String deviceId,
                                        @Param("now") LocalDateTime now);

    boolean existsByUser_UserIdAndRevokedFalse(String userId);

    boolean existsByUser_UserIdAndDeviceIdAndRevokedFalse(String userId, String deviceId);
}
