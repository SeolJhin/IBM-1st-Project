package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    /** 같은 유저의 미사용·미만료 토큰 조회 (중복 발급 방지용) */
    @Query("""
            SELECT p FROM PasswordResetToken p
            WHERE p.userId = :userId
              AND p.used = false
              AND p.expiresAt > :now
            """)
    Optional<PasswordResetToken> findActiveByUserId(@Param("userId") String userId,
                                                     @Param("now") LocalDateTime now);

    /** 만료된 토큰 정리 (배치 or 발급 시점에 호출) */
    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
}
