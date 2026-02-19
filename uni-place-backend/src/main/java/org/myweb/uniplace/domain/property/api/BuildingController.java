package org.myweb.uniplace.domain.property.api;


import org.myweb.uniplace.domain.property.api.dto.response.BuildingResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingResponse> detail(@PathVariable Long buildingId) {
        return ApiResponse.ok(buildingService.getBuilding(buildingId));
    }

}
