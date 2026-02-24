// 경로: org/myweb/uniplace/domain/property/api/BuildingController.java
package org.myweb.uniplace.domain.property.api;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.BuildingSummaryResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;
import org.myweb.uniplace.domain.property.application.BuildingService;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/buildings")
public class BuildingController {

    private final BuildingService buildingService;
    private final RoomService roomService;
    private final SpaceService spaceService;

    @GetMapping("/{buildingId}")
    public ApiResponse<BuildingDetailResponse> detail(
            @PathVariable("buildingId") Integer buildingId
    ) {
        return ApiResponse.ok(buildingService.getBuilding(buildingId));
    }

    // ✅ 필터 제거: 건물 목록 페이징만
    @GetMapping
    public ApiResponse<PageResponse<BuildingSummaryResponse>> list(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "buildingId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        Page<BuildingSummaryResponse> result = buildingService.searchPage(pageable);
        return ApiResponse.ok(PageResponse.of(result));
    }

    // ✅ 빌딩ID로 객실 조회
    @GetMapping("/{buildingId}/rooms")
    public ApiResponse<PageResponse<RoomSummaryResponse>> rooms(
            @PathVariable("buildingId") Integer buildingId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "roomId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        RoomSearchRequest request = RoomSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        Page<RoomSummaryResponse> result = roomService.searchPage(request, pageable);
        return ApiResponse.ok(PageResponse.of(result));
    }

    // ✅ 빌딩ID로 공용공간(스페이스) 조회
    @GetMapping("/{buildingId}/spaces")
    public ApiResponse<PageResponse<SpaceResponse>> spaces(
            @PathVariable("buildingId") Integer buildingId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "spaceId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        SpaceSearchRequest request = SpaceSearchRequest.builder()
                .buildingId(buildingId)
                .build();

        Page<SpaceResponse> result = spaceService.searchPage(request, pageable);
        return ApiResponse.ok(PageResponse.of(result));
    }
}