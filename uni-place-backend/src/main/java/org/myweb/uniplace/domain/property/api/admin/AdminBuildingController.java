package org.myweb.uniplace.domain.property.api.admin;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/buildings")
public class AdminBuildingController {

    private final BuildingService buildingService;

    @PostMapping
    public ApiResponse<BuildingResponse> create(@Validated @ModelAttribute BuildingCreateRequest request) {
        return ApiResponse.ok(buildingService.createBuilding(request));
    }

    @PutMapping("/{buildingId}")
    public ApiResponse<BuildingResponse> update(
            @PathVariable Long buildingId,
            @Validated @ModelAttribute BuildingUpdateRequest request
    ) {
        request.setBuildingId(buildingId); // DTO에 Id 세팅
        return ApiResponse.ok(buildingService.updateBuilding(request));
    }

    @PatchMapping("/{buildingId}/deactivate")
    public ApiResponse<Void> deactivate(@PathVariable Long buildingId) {
        buildingService.deactivateBuilding(buildingId);
        return ApiResponse.ok();
    }
}
