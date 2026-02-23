package org.myweb.uniplace.domain.support.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.NoticeUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.NoticeResponse;
import org.myweb.uniplace.domain.support.application.NoticeService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notices")
public class NoticeController {

    private final NoticeService noticeService;

    /** 공지 목록 */
    @GetMapping
    public ApiResponse<PageResponse<NoticeResponse>> search(
            @ModelAttribute NoticeSearchRequest request,
            @PageableDefault(size = 10, sort = "noticeId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(noticeService.search(request, pageable));
    }

    /** 공지 상세 */
    @GetMapping("/{noticeId}")
    public ApiResponse<NoticeResponse> detail(@PathVariable Integer noticeId) {
        return ApiResponse.ok(noticeService.get(noticeId));
    }

    /** 공지 등록 */
    @PostMapping
    public ApiResponse<NoticeResponse> create(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody NoticeCreateRequest request
    ) {
        return ApiResponse.ok(noticeService.create(requireUserId(authUser), request));
    }

    /** 공지 수정 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{noticeId}")
    public ApiResponse<NoticeResponse> update(
            @PathVariable Integer noticeId,
            @Valid @RequestBody NoticeUpdateRequest request
    ) {
        return ApiResponse.ok(noticeService.update(noticeId, request));
    }

    /** 공지 삭제 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{noticeId}")
    public ApiResponse<Void> delete(@PathVariable Integer noticeId) {
        noticeService.delete(noticeId);
        return ApiResponse.ok();
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
