package org.myweb.uniplace.domain.property.api;

import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;


@RestController
@RequiredArgsConstructor
@RequestMapping("/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping
    public ApiResponse<Page<BuildingSummaryResponse>> search(
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return ApiResponse.ok(buildingService.search(keyword, pageable));
    }

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> detail(
            @PathVariable Integer buildingId
    ) {
        return ApiResponse.ok(buildingService.getDetail(buildingId));
    }
}
