package org.myweb.uniplace.domain.system.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.domain.entity.Banner;
import org.myweb.uniplace.domain.system.domain.enums.BannerStatus;
import org.myweb.uniplace.domain.system.repository.BannerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;

    @Override
    public List<BannerResponse> getActive(LocalDateTime now) {
        return bannerRepository
                .findByBanStAndStartAtLessThanEqualAndEndAtGreaterThanEqualOrderByBanOrderAsc(
                        BannerStatus.active, now, now
                )
                .stream()
                .map(BannerResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public BannerResponse create(LocalDateTime startAt, LocalDateTime endAt, String title, String url, Integer order) {
        if (startAt == null || endAt == null) {
            throw new IllegalArgumentException("startAt/endAt은 필수입니다.");
        }
        if (endAt.isBefore(startAt)) {
            throw new IllegalArgumentException("endAt은 startAt 이후여야 합니다.");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("banTitle은 필수입니다.");
        }
        if (order == null) {
            throw new IllegalArgumentException("banOrder는 필수입니다.");
        }

        Banner banner = Banner.builder()
                .startAt(startAt)
                .endAt(endAt)
                .banTitle(title)
                .banUrl(url)
                .banOrder(order)
                .banSt(BannerStatus.active)
                .build();

        Banner saved = bannerRepository.save(banner);
        return BannerResponse.from(saved);
    }

    @Override
    @Transactional
    public BannerResponse update(Integer banId, LocalDateTime startAt, LocalDateTime endAt, String title, String url, Integer order, String status) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다. banId=" + banId));

        BannerStatus st = null;
        if (status != null) {
            st = BannerStatus.valueOf(status); // "active"/"inactive"
        }

        if (startAt != null && endAt != null && endAt.isBefore(startAt)) {
            throw new IllegalArgumentException("endAt은 startAt 이후여야 합니다.");
        }

        banner.update(startAt, endAt, title, url, order, st);
        return BannerResponse.from(banner);
    }

    @Override
    @Transactional
    public void delete(Integer banId) {
        if (!bannerRepository.existsById(banId)) {
            throw new IllegalArgumentException("배너를 찾을 수 없습니다. banId=" + banId);
        }
        bannerRepository.deleteById(banId);
    }
}