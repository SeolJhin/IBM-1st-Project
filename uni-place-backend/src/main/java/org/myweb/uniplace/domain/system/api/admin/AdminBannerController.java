package org.myweb.uniplace.domain.system.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.request.BannerCreateRequest;
import org.myweb.uniplace.domain.system.api.dto.request.BannerUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.application.BannerService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/banners")
public class AdminBannerController {

    private final BannerService bannerService;

    @PostMapping
    public ApiResponse<BannerResponse> create(@RequestBody BannerCreateRequest request) {
        return ApiResponse.ok(bannerService.create(request));
    }

    @PatchMapping("/{banId}")
    public ApiResponse<BannerResponse> update(
            @PathVariable Integer banId,
            @RequestBody BannerUpdateRequest request
    ) {
        return ApiResponse.ok(bannerService.update(banId, request));
    }

    @DeleteMapping("/{banId}")
    public ApiResponse<Void> delete(@PathVariable Integer banId) {
        bannerService.delete(banId);
        return ApiResponse.ok();
    }
}