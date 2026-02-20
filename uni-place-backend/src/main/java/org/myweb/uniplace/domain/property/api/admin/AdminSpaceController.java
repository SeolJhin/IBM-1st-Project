// Controller
// 경로: org/myweb/uniplace/domain/property/api/admin/AdminSpaceController.java
package org.myweb.uniplace.domain.property.api.admin;

import org.myweb.uniplace.domain.property.api.dto.request.SpaceCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceDetailResponse;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/spaces")
public class AdminSpaceController {

    private final SpaceService spaceService;

    // ✅ 체크표시(관리자 전용): 등록
    @PostMapping
    public ApiResponse<SpaceDetailResponse> create(
            @Validated @RequestBody SpaceCreateRequest request
    ) {
        return ApiResponse.ok(spaceService.createSpace(request));
    }

    // ✅ 체크표시(관리자 전용): 수정
    @PutMapping("/{spaceId}")
    public ApiResponse<SpaceDetailResponse> update(
            @PathVariable Integer spaceId,
            @Validated @RequestBody SpaceUpdateRequest request
    ) {
        return ApiResponse.ok(spaceService.updateSpace(spaceId, request));
    }

    // ✅ 체크표시(관리자 전용): 삭제
    @DeleteMapping("/{spaceId}")
    public ApiResponse<Void> delete(
            @PathVariable Integer spaceId
    ) {
        spaceService.deleteSpace(spaceId);
        return ApiResponse.ok(null);
    }
}