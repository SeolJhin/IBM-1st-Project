package org.myweb.uniplace.domain.property.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.global.response.ApiResponse;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> detail(@PathVariable Integer buildingId) {
        return ApiResponse.ok(buildingService.getBuilding(buildingId));
    }

    @GetMapping
    public ApiResponse<List<BuildingDetailResponse>> list() {
        return ApiResponse.ok(buildingService.getAllBuildings());
    }
}
