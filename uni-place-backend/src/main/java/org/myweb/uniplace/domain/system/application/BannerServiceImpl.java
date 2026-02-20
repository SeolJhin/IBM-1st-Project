package org.myweb.uniplace.domain.system.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerOrderRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.domain.entity.Banner;
import org.myweb.uniplace.domain.system.domain.enums.BannerStatus;
import org.myweb.uniplace.domain.system.repository.BannerRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;

    // ========== public ==========

    @Override
    public List<BannerResponse> getActiveBanners() {
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
    public BannerResponse getBanner(Integer banId) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        return BannerResponse.from(banner);
    }

    // ========== admin ==========

    @Override
    public PageResponse<BannerResponse> bannerList(Pageable pageable) {
        Page<BannerResponse> page = bannerRepository.findAll(pageable).map(BannerResponse::from);
        return PageResponse.of(page);
    }

    @Override
    @Transactional
    public void createBanner(BannerCreateRequest request, MultipartFile file) {
        validatePeriod(request.getStartAt(), request.getEndAt());

        Banner banner = Banner.builder()
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .banTitle(requireText(request.getBanTitle(), "banTitle"))
                .banOrder(requireNotNull(request.getBanOrder(), "banOrder"))
                .banUrl(resolveBannerUrl(request.getBanUrl(), file))
                .banSt(BannerStatus.active)
                .build();

        bannerRepository.save(banner);
    }

    @Override
    @Transactional
    public void updateBanner(Integer banId, BannerUpdateRequest request, boolean deleteFlag, MultipartFile file) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        // 기간 검증: 둘 다 들어온 경우에만
        if (request.getStartAt() != null && request.getEndAt() != null) {
            validatePeriod(request.getStartAt(), request.getEndAt());
        }

        String newUrl = null;

        if (deleteFlag) {
            newUrl = null;
        } else if (file != null && !file.isEmpty()) {
            newUrl = resolveBannerUrl(null, file);
        } else if (request.getBanUrl() != null) {
            newUrl = request.getBanUrl();
        }

        banner.update(
                request.getStartAt(),
                request.getEndAt(),
                request.getBanTitle(),
                newUrl,
                request.getBanOrder(),
                null
        );
    }

    @Override
    @Transactional
    public void deleteBanner(Integer banId) {
        if (!bannerRepository.existsById(banId)) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }
        bannerRepository.deleteById(banId);
    }

    @Override
    @Transactional
    public void updateBannerStatus(Integer banId, String status) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        BannerStatus st;
        try {
            st = BannerStatus.valueOf(status);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        banner.changeStatus(st);
    }

    @Override
    @Transactional
    public void updateOrder(List<BannerOrderRequest> orders) {
        if (orders == null || orders.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        for (BannerOrderRequest o : orders) {
            if (o.getBanId() == null || o.getBanOrder() == null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }
            Banner banner = bannerRepository.findById(o.getBanId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
            banner.changeOrder(o.getBanOrder());
        }
    }

    // ========== helpers ==========

    private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null) throw new BusinessException(ErrorCode.BAD_REQUEST);
        if (endAt.isBefore(startAt)) throw new BusinessException(ErrorCode.BAD_REQUEST);
    }

    private String requireText(String v, String field) {
        if (v == null || v.isBlank()) throw new BusinessException(ErrorCode.BAD_REQUEST);
        return v;
    }

    private Integer requireNotNull(Integer v, String field) {
        if (v == null) throw new BusinessException(ErrorCode.BAD_REQUEST);
        return v;
    }

    /**
     * 파일 저장 로직은 프로젝트 공통 업로드 구현이 생기면 거기로 교체.
     * 지금은 "URL/경로 문자열만" 세팅하는 최소 구현.
     */
    private String resolveBannerUrl(String banUrl, MultipartFile file) {
        if (file != null && !file.isEmpty()) {
            String name = file.getOriginalFilename();
            if (name == null || name.isBlank()) name = "banner";
            return "/uploads/banners/" + name; // TODO: 실제 저장/URL 반환으로 교체
        }
        return banUrl;
    }
}