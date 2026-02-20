package org.myweb.uniplace.domain.system.api;

import java.util.List;

import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.application.BannerService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/banners")
public class BannerController {

    private final BannerService bannerService;

    // 현재 노출 배너 목록
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getActiveBanners() {
        return ResponseEntity.ok(ApiResponse.ok(bannerService.getActiveBanners()));
    }

    // 배너 상세(관리자 미리보기겸용)
    @GetMapping("/{banId}")
    public ResponseEntity<ApiResponse<BannerResponse>> getBanner(@PathVariable int banId) {
        return ResponseEntity.ok(ApiResponse.ok(bannerService.getBanner(banId)));
    }
}