package org.myweb.uniplace.domain.system.application;

import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerOrderRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BannerService {

    // public
    List<BannerResponse> getActiveBanners();
    BannerResponse getBanner(Integer banId); // 관리자 미리보기 겸용

    // admin
    PageResponse<BannerResponse> bannerList(Pageable pageable);
    void createBanner(BannerCreateRequest request, MultipartFile file);
    void updateBanner(Integer banId, BannerUpdateRequest request, boolean deleteFlag, MultipartFile file);
    void deleteBanner(Integer banId);
    void updateBannerStatus(Integer banId, String status);
    void updateOrder(List<BannerOrderRequest> orders);
}