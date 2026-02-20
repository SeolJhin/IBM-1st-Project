package org.myweb.uniplace.domain.system.api.admin;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.application.BannerService;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/banners")
public class AdminBannerController {

    private final BannerService bannerService;

    @Getter
    public static class BannerCreateRequest {
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private String banTitle;
        private String banUrl;
        private Integer banOrder;
    }

    @Getter
    public static class BannerUpdateRequest {
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private String banTitle;
        private String banUrl;
        private Integer banOrder;
        private String banSt; // "active" / "inactive"
    }

    @PostMapping
    public ApiResponse<BannerResponse> create(@RequestBody BannerCreateRequest request) {
        return ApiResponse.ok(
                bannerService.create(
                        request.getStartAt(),
                        request.getEndAt(),
                        request.getBanTitle(),
                        request.getBanUrl(),
                        request.getBanOrder()
                )
        );
    }

    @PatchMapping("/{banId}")
    public ApiResponse<BannerResponse> update(
            @PathVariable Integer banId,
            @RequestBody BannerUpdateRequest request
    ) {
        return ApiResponse.ok(
                bannerService.update(
                        banId,
                        request.getStartAt(),
                        request.getEndAt(),
                        request.getBanTitle(),
                        request.getBanUrl(),
                        request.getBanOrder(),
                        request.getBanSt()
                )
        );
    }

    @DeleteMapping("/{banId}")
    public ApiResponse<Void> delete(@PathVariable Integer banId) {
        bannerService.delete(banId);
        return ApiResponse.ok(null);
    }
}