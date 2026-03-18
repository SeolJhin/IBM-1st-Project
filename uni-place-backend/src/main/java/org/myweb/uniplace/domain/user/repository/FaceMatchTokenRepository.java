package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.FaceMatchToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface FaceMatchTokenRepository extends JpaRepository<FaceMatchToken, String> {

    Optional<FaceMatchToken> findByToken(String token);

    /** 만료된 토큰 정리 (스케줄러 또는 배치 호출용) */
    @Modifying
    @Query("DELETE FROM FaceMatchToken t WHERE t.expireAt < :now OR t.used = true")
    void deleteExpiredTokens(LocalDateTime now);
}