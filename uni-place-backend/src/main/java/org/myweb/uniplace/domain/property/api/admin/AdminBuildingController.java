package org.myweb.uniplace.domain.property.api.admin;

import org.myweb.uniplace.domain.property.api.dto.request.BuildingCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.BuildingUpdateRequest;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/buildings")
public class AdminBuildingController {

    private final BuildingService buildingService;

    @PostMapping
    public ApiResponse<Integer> create(
            @Valid @RequestBody BuildingCreateRequest request
    ) {
        return ApiResponse.ok(buildingService.create(request));
    }

    @PutMapping("/{buildingId}")
    public ApiResponse<Void> update(
            @PathVariable Integer buildingId,
            @Valid @RequestBody BuildingUpdateRequest request
    ) {
        buildingService.update(buildingId, request);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{buildingId}")
    public ApiResponse<Void> delete(
            @PathVariable Integer buildingId
    ) {
        buildingService.delete(buildingId);
        return ApiResponse.ok(null);
    }
}
