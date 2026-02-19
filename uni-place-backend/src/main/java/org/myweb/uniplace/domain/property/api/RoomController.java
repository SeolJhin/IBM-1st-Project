// 경로: org/myweb/uniplace/domain/property/api/RoomController.java
package org.myweb.uniplace.domain.property.api;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{roomId}")
    public ApiResponse<RoomDetailResponse> detail(@PathVariable Integer roomId) {
        return ApiResponse.ok(roomService.getRoom(roomId));
    }

    //  페이징 + 필터
    @GetMapping
    public ApiResponse<PageResponse<RoomSummaryResponse>> search(
            @ModelAttribute RoomSearchRequest request,
            @PageableDefault(size = 10, sort = "roomId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(roomService.search(request, pageable));
    }
}