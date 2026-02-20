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
@Transactional(readOnly = true)
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final FileService fileService;

    private static final String PARENT_TYPE_BANNER = "BANNER";

    // =========================
    // public
    // =========================

    @Override
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
    public BannerResponse getBanner(Integer banId) {
        Banner banner = bannerRepository.findById(banId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        return BannerResponse.fromEntity(banner, loadBannerFiles(banId));
    }

    // =========================
    // admin
    // =========================

    @Override
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

        // ✅ banUrl = 클릭 이동 URL(임의 링크)
        Banner banner = Banner.builder()
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .banTitle(request.getBanTitle())
                .banUrl(request.getBanUrl())
                .banOrder(request.getBanOrder())
                .banSt(BannerStatus.active)
                .build();

        Banner saved = bannerRepository.save(banner);

        // ✅ 배너 이미지 파일은 files에 저장(parentType=BANNER, parentId=banId)
        if (file != null && !file.isEmpty()) {
            // 배너는 대표 1장 정책이면 그냥 업로드
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

        // ✅ 이미지 삭제 플래그면 files만 삭제(soft delete)
        if (deleteFlag) {
            softDeleteAllBannerFiles(banId);
        }

        // ✅ 새 파일 업로드면 기존 이미지 soft delete 후 교체(대표 1장 정책)
        if (file != null && !file.isEmpty()) {
            softDeleteAllBannerFiles(banId);
            uploadBannerFile(banId, file);
        }

        // ✅ 배너 자체 정보 수정 (banUrl은 클릭 이동 링크)
        banner.update(
                request.getStartAt(),
                request.getEndAt(),
                request.getBanTitle(),
                request.getBanUrl(),
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

        // 배너 삭제 전에 파일 soft delete
        softDeleteAllBannerFiles(banId);

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

    // =========================
    // file helpers
    // =========================

    private List<FileResponse> loadBannerFiles(Integer banId) {
        // ✅ delete_yn='N'만 (FileServiceImpl이 desc 정렬로 줌)
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