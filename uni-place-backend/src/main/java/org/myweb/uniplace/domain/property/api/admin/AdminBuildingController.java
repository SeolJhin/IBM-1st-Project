package org.myweb.uniplace.domain.property.api.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.myweb.uniplace.domain.property.application.BuildingService;

import java.util.List;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.global.response.ApiResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/buildings")
public class AdminBuildingController {

    private final BuildingService buildingService;

    @PostMapping
    public ApiResponse<BuildingDetailResponse> create(@Validated @RequestBody BuildingCreateRequest request) {
        return ApiResponse.ok(buildingService.createBuilding(request));
    }

    @PutMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> update(
            @PathVariable Integer buildingId,
            @Validated @RequestBody BuildingCreateRequest request
    ) {
        return ApiResponse.ok(buildingService.updateBuilding(buildingId, request));
    }

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> detail(@PathVariable Integer buildingId) {
        return ApiResponse.ok(buildingService.getBuilding(buildingId));
    }

    @GetMapping
    public ApiResponse<List<BuildingDetailResponse>> list() {
        return ApiResponse.ok(buildingService.getAllBuildings());
    }
}
