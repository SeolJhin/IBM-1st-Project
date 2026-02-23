package org.myweb.uniplace.domain.support.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainReplyRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.ComplainUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.ComplainResponse;
import org.myweb.uniplace.domain.support.application.ComplainService;
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
@RequestMapping("/complains")
public class ComplainController {

    private final ComplainService complainService;

    /** 전체 민원 목록 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<PageResponse<ComplainResponse>> search(
            @ModelAttribute ComplainSearchRequest request,
            @PageableDefault(size = 20, sort = "compId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(complainService.search(request, pageable));
    }

    /** 내 민원 목록 */
    @GetMapping("/me")
    public ApiResponse<PageResponse<ComplainResponse>> myList(
            @AuthenticationPrincipal AuthUser authUser,
            @PageableDefault(size = 10, sort = "compId", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.ok(complainService.getMyList(requireUserId(authUser), pageable));
    }

    /** 민원 상세 */
    @GetMapping("/{compId}")
    public ApiResponse<ComplainResponse> detail(@PathVariable Integer compId) {
        return ApiResponse.ok(complainService.get(compId));
    }

    /** 민원 등록 */
    @PostMapping
    public ApiResponse<ComplainResponse> create(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody ComplainCreateRequest request
    ) {
        return ApiResponse.ok(complainService.create(requireUserId(authUser), request));
    }

    /** 민원 수정 */
    @PutMapping("/{compId}")
    public ApiResponse<ComplainResponse> update(
            @PathVariable Integer compId,
            @Valid @RequestBody ComplainUpdateRequest request
    ) {
        return ApiResponse.ok(complainService.update(compId, request));
    }

    /** 상태 변경 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{compId}/status")
    public ApiResponse<ComplainResponse> updateStatus(
            @PathVariable Integer compId,
            @Valid @RequestBody ComplainUpdateRequest request
    ) {
        return ApiResponse.ok(complainService.updateStatus(compId, request));
    }

    /** 관리자 답변 처리 - reply_ck='Y' + 상태 변경 */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{compId}/reply")
    public ApiResponse<ComplainResponse> createReply(
            @PathVariable Integer compId,
            @RequestBody ComplainReplyRequest request
    ) {
        return ApiResponse.ok(complainService.createReply(compId, request));
    }

    /** 민원 삭제 */
    @DeleteMapping("/{compId}")
    public ApiResponse<Void> delete(@PathVariable Integer compId) {
        complainService.delete(compId);
        return ApiResponse.ok();
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
