// 경로: org/myweb/uniplace/domain/property/api/RoomController.java
package org.myweb.uniplace.domain.property.api;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
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
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{roomId}")
    public ApiResponse<RoomDetailResponse> detail(
            @PathVariable("roomId") Integer roomId
    ) {
        return ApiResponse.ok(roomService.getRoom(roomId));
    }

    @GetMapping
    public ApiResponse<PageResponse<RoomSummaryResponse>> list(
            @ModelAttribute RoomSearchRequest request,
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

        Page<RoomSummaryResponse> result = roomService.searchPage(request, pageable);
        return ApiResponse.ok(PageResponse.of(result));
    }
}