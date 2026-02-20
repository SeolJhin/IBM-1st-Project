package org.myweb.uniplace.domain.system.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.domain.entity.Banner;
import org.myweb.uniplace.domain.system.domain.enums.BannerStatus;
import org.myweb.uniplace.domain.system.repository.BannerRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
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
    public List<BannerResponse> getActiveNow() {
        LocalDateTime now = LocalDateTime.now();
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
    public BannerResponse create(BannerCreateRequest request) {

        if (request.getStartAt() == null || request.getEndAt() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (request.getEndAt().isBefore(request.getStartAt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (request.getBanTitle() == null || request.getBanTitle().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (request.getBanOrder() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Banner banner = Banner.builder()
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .banTitle(request.getBanTitle())
                .banUrl(request.getBanUrl())
                .banOrder(request.getBanOrder())
                .banSt(BannerStatus.active)
                .build();

        return BannerResponse.from(bannerRepository.save(banner));
    }

    @Override
    @Transactional
    public BannerResponse update(Integer banId, BannerUpdateRequest request) {

        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        if (request.getStartAt() != null && request.getEndAt() != null
                && request.getEndAt().isBefore(request.getStartAt())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        BannerStatus st = null;
        if (request.getBanSt() != null) {
            st = BannerStatus.valueOf(request.getBanSt()); // active/inactive
        }

        banner.update(
                request.getStartAt(),
                request.getEndAt(),
                request.getBanTitle(),
                request.getBanUrl(),
                request.getBanOrder(),
                st
        );

        return BannerResponse.from(banner);
    }

    @Override
    @Transactional
    public void delete(Integer banId) {
        if (!bannerRepository.existsById(banId)) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        bannerRepository.deleteById(banId);
    }
}