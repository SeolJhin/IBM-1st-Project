package org.myweb.uniplace.domain.system.repository;

import org.myweb.uniplace.domain.system.domain.entity.Banner;
import org.myweb.uniplace.domain.system.domain.enums.BannerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Integer> {
    List<Banner> findByBanStAndStartAtLessThanEqualAndEndAtGreaterThanEqualOrderByBanOrderAsc(
            BannerStatus banSt,
            LocalDateTime now1,
            LocalDateTime now2
    );
}