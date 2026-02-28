package org.myweb.uniplace.domain.system.application;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final FileService fileService;

    private static final String PARENT_TYPE_BANNER = "BANNER";

    // =========================
    // public (조회는 readOnly)
    // =========================

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveBanners() {
        LocalDateTime now = LocalDateTime.now();

        List<Banner> banners =
                bannerRepository.findByBanStAndStartAtLessThanEqualAndEndAtGreaterThanEqualOrderByBanOrderAsc(
                        BannerStatus.active, now, now
                );

        return banners.stream()
                .map(b -> BannerResponse.fromEntity(b, loadBannerFiles(b.getBanId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BannerResponse getBanner(Integer banId) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        return BannerResponse.fromEntity(banner, loadBannerFiles(banId));
    }

    // =========================
    // admin (수정/삭제/등록은 readOnly 금지)
    // =========================

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BannerResponse> bannerList(Pageable pageable) {
        Page<BannerResponse> page = bannerRepository.findAll(pageable)
                .map(b -> BannerResponse.fromEntity(b, loadBannerFiles(b.getBanId())));
        return PageResponse.of(page);
    }

    @Override
    @Transactional
    public void createBanner(BannerCreateRequest request, MultipartFile file) {

        validatePeriod(request.getStartAt(), request.getEndAt());
        requireText(request.getBanTitle());
        requireNotNull(request.getBanOrder());

        Banner banner = Banner.builder()
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .banTitle(request.getBanTitle())
                .banUrl(request.getBanUrl())
                .banOrder(request.getBanOrder())
                .banSt(BannerStatus.active)
                .build();

        Banner saved = bannerRepository.saveAndFlush(banner); // ✅ flush

        if (file != null && !file.isEmpty()) {
            uploadBannerFile(saved.getBanId(), file);
        }
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

        if (deleteFlag) {
            softDeleteAllBannerFiles(banId);
        }

        if (file != null && !file.isEmpty()) {
            softDeleteAllBannerFiles(banId);
            uploadBannerFile(banId, file);
        }

        // ✅ 배너 정보 수정
        banner.update(
                request.getStartAt(),
                request.getEndAt(),
                request.getBanTitle(),
                request.getBanUrl(),
                request.getBanOrder(),
                null
        );

        // ✅ (선택) PUT에 banSt까지 받는다면 여기서 같이 반영 가능
        // 프론트에서 PUT에 banSt를 같이 보낸다면 PATCH 없이 저장 1번으로 끝낼 수 있음
        if (request.getBanSt() != null && !request.getBanSt().isBlank()) {
            BannerStatus st;
            try {
                st = BannerStatus.valueOf(request.getBanSt());
            } catch (Exception e) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }
            banner.changeStatus(st);
        }

        // ✅ 핵심: 더티체킹/flush 이슈를 강제로 제거
        bannerRepository.saveAndFlush(banner);
    }

    @Override
    @Transactional
    public void deleteBanner(Integer banId) {
        if (!bannerRepository.existsById(banId)) {
            throw new BusinessException(ErrorCode.BANNER_NOT_FOUND);
        }

        softDeleteAllBannerFiles(banId);
        bannerRepository.deleteById(banId);
        bannerRepository.flush();
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

        // ✅ 상태도 강제 반영
        bannerRepository.saveAndFlush(banner);
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

            // ✅ 반복문 안에서라도 flush로 확실히 반영 (원하면 마지막에 한번만 flush도 가능)
            bannerRepository.save(banner);
        }

        bannerRepository.flush();
    }

    // =========================
    // file helpers
    // =========================

    private List<FileResponse> loadBannerFiles(Integer banId) {
        return fileService.getActiveFiles(PARENT_TYPE_BANNER, banId);
    }

    private void uploadBannerFile(Integer banId, MultipartFile file) {

        FileUploadRequest req = FileUploadRequest.builder()
                .fileParentType(PARENT_TYPE_BANNER)
                .fileParentId(banId)
                .files(List.of(file))
                .build();

        FileUploadResponse uploaded = fileService.uploadFiles(req);

        if (uploaded.getFiles() == null || uploaded.getFiles().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
    }

    private void softDeleteAllBannerFiles(Integer banId) {
        List<FileResponse> all = fileService.getAllFilesForAdmin(PARENT_TYPE_BANNER, banId);
        if (all == null || all.isEmpty()) return;

        List<Integer> ids = all.stream().map(FileResponse::getFileId).toList();
        fileService.softDeleteFiles(ids);
    }

    // =========================
    // validation
    // =========================

    private void validatePeriod(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null) throw new BusinessException(ErrorCode.BAD_REQUEST);
        if (endAt.isBefore(startAt)) throw new BusinessException(ErrorCode.BAD_REQUEST);
    }

    private void requireText(String v) {
        if (v == null || v.isBlank()) throw new BusinessException(ErrorCode.BAD_REQUEST);
    }

    private void requireNotNull(Integer v) {
        if (v == null) throw new BusinessException(ErrorCode.BAD_REQUEST);
    }
}