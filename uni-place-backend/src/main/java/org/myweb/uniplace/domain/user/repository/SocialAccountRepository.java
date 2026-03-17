package org.myweb.uniplace.domain.user.repository;

import java.util.Optional;
import java.util.List;
import org.myweb.uniplace.domain.user.domain.entity.SocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Integer> {

    @Query("""
        select sa
        from SocialAccount sa
        join fetch sa.user u
        where sa.provider = :provider
          and sa.providerUserId = :providerUserId
    """)
    Optional<SocialAccount> findByProviderAndProviderUserId(
        @Param("provider") String provider,
        @Param("providerUserId") String providerUserId
    );

    boolean existsByProviderAndProviderUserId(String provider, String providerUserId);

    boolean existsByUser_UserId(String userId);

    List<SocialAccount> findAllByUser_UserId(String userId);

    Optional<SocialAccount> findByUser_UserIdAndProvider(String userId, String provider);
}
