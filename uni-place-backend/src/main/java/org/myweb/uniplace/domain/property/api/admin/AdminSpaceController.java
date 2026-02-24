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
    public ApiResponse<SpaceDetailResponse> detail(
            @PathVariable("spaceId") Integer spaceId
    ) {
        // 관리자 상세 (삭제 포함 필요 시 service 분리 가능)
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
            @PathVariable("spaceId") Integer spaceId,
            @Validated @ModelAttribute SpaceUpdateRequest request
    ) {
        return ApiResponse.ok(spaceService.updateSpace(spaceId, request));
    }

    @DeleteMapping("/{spaceId}")
    public ApiResponse<Void> delete(
            @PathVariable("spaceId") Integer spaceId
    ) {
        spaceService.deleteSpace(spaceId);
        return ApiResponse.ok();
    }
}