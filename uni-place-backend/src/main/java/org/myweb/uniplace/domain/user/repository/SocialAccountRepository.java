package org.myweb.uniplace.domain.user.repository;

import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Integer> {
	// “이미 연동된 소셜 계정이면 바로 로그인”, “처음이면 가입완료로 이동” 분기 처리에 사용
	// provider/providerUserId로 소셜 계정 조회 + userId로 연결 여부 확인
    Optional<SocialAccount> findByProviderAndProviderUserId(String provider, String providerUserId);

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);

    boolean existsByUser_UserId(String userId);
}
