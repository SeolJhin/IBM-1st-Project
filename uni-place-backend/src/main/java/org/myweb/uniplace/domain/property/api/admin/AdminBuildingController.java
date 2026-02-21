// 경로: org/myweb/uniplace/domain/property/api/admin/AdminBuildingController.java
package org.myweb.uniplace.domain.property.api.admin;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/buildings")
public class AdminBuildingController {

    private final BuildingService buildingService;

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> detail(@PathVariable Integer buildingId) {
        return ApiResponse.ok(buildingService.getBuildingForAdmin(buildingId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BuildingDetailResponse> create(
            @Validated @ModelAttribute BuildingCreateRequest request
    ) {
        return ApiResponse.ok(buildingService.createBuilding(request));
    }

    @PutMapping(value = "/{buildingId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BuildingDetailResponse> update(
            @PathVariable Integer buildingId,
            @Validated @ModelAttribute BuildingUpdateRequest request
    ) {
        return ApiResponse.ok(buildingService.updateBuilding(buildingId, request));
    }

    @DeleteMapping("/{buildingId}")
    public ApiResponse<Void> delete(@PathVariable Integer buildingId) {
        buildingService.deleteBuilding(buildingId);
        return ApiResponse.ok();
    }
}