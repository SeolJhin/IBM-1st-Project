// 경로: org/myweb/uniplace/domain/property/api/admin/AdminSpaceController.java
package org.myweb.uniplace.domain.property.api.admin;

import org.myweb.uniplace.domain.property.api.dto.request.SpaceCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceDetailResponse;
import org.myweb.uniplace.domain.property.application.SpaceService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/spaces")
public class AdminSpaceController {

    private final SpaceService spaceService;

    @GetMapping("/{spaceId}")
    public ApiResponse<SpaceDetailResponse> detail(@PathVariable Integer spaceId) {
        // 일반 상세와 동일(삭제 포함/관리자 분리 필요하면 서비스 메서드 추가 가능)
        return ApiResponse.ok(spaceService.getSpace(spaceId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SpaceDetailResponse> create(
            @Validated @ModelAttribute SpaceCreateRequest request
    ) {
        return ApiResponse.ok(spaceService.createSpace(request));
    }

    @PutMapping(value = "/{spaceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SpaceDetailResponse> update(
            @PathVariable Integer spaceId,
            @Validated @ModelAttribute SpaceUpdateRequest request
    ) {
        return ApiResponse.ok(spaceService.updateSpace(spaceId, request));
    }

    @DeleteMapping("/{spaceId}")
    public ApiResponse<Void> delete(@PathVariable Integer spaceId) {
        spaceService.deleteSpace(spaceId);
        return ApiResponse.ok();
    }
}