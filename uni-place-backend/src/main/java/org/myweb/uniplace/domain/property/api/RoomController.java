// 경로: org/myweb/uniplace/domain/property/api/RoomController.java
package org.myweb.uniplace.domain.property.api;

import java.util.List;

import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.application.RoomService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<RoomDetailResponse>> detail(
            @PathVariable Integer roomId
    ) {
        return ResponseEntity.ok(
                ApiResponse.ok(roomService.getRoom(roomId))
        );
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<RoomSummaryResponse>>> list(
            RoomSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "roomId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct)
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        long totalElements = roomService.count(request);
        int totalPages =
                totalElements == 0
                        ? 0
                        : (int) Math.ceil((double) totalElements / size);

        List<RoomSummaryResponse> list =
                roomService.searchList(request, pageable);

        PageResponse<RoomSummaryResponse> body =
                new PageResponse<>(list, page, size, totalElements, totalPages);

        return ResponseEntity.ok(
                ApiResponse.ok("방 목록 조회 성공", body)
        );
    }
}