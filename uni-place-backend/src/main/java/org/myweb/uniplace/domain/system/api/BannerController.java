package org.myweb.uniplace.domain.system.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.response.BannerResponse;
import org.myweb.uniplace.domain.system.application.BannerService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/banners")
public class BannerController {

    private final BannerService bannerService;

    @GetMapping("/active")
    public ApiResponse<List<BannerResponse>> activeNow() {
        return ApiResponse.ok(bannerService.getActiveNow());
    }
}