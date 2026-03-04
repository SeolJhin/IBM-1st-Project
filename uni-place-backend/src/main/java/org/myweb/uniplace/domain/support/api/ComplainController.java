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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/complains", "/api/complains"})
public class ComplainController {

    private final ComplainService complainService;

    /** 전체 민원 목록 (관리자) */
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ApiResponse<PageResponse<ComplainResponse>> search(
            @AuthenticationPrincipal AuthUser authUser,
            @ModelAttribute ComplainSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "compId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 20;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);
        if (!isAdmin(authUser)) {
            request.setUserId(requireUserId(authUser));
        }
        return ApiResponse.ok(complainService.search(request, pageable));
    }

    /** 내 민원 목록 */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ApiResponse<PageResponse<ComplainResponse>> myList(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "compId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(complainService.getMyList(requireUserId(authUser), pageable));
    }

    /** 민원 상세 */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{compId}")
    public ApiResponse<ComplainResponse> detail(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("compId") Integer compId
    ) {
        ComplainResponse response = complainService.get(compId);
        if (!isAdmin(authUser) && !requireUserId(authUser).equals(response.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.ok(response);
    }

    /** 민원 등록 */
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT')")
    @PostMapping
    public ApiResponse<ComplainResponse> create(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody ComplainCreateRequest request
    ) {
        return ApiResponse.ok(complainService.create(requireUserId(authUser), request));
    }

    /** 민원 수정 */
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT')")
    @PutMapping("/{compId}")
    public ApiResponse<ComplainResponse> update(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("compId") Integer compId,
            @Valid @RequestBody ComplainUpdateRequest request
    ) {
        if (!isAdmin(authUser)) {
            ComplainResponse existing = complainService.get(compId);
            if (!requireUserId(authUser).equals(existing.getUserId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }
        return ApiResponse.ok(complainService.update(compId, request));
    }

    /** 상태 변경 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{compId}/status")
    public ApiResponse<ComplainResponse> updateStatus(
            @PathVariable("compId") Integer compId,
            @Valid @RequestBody ComplainUpdateRequest request
    ) {
        return ApiResponse.ok(complainService.updateStatus(compId, request));
    }

    /** 관리자 답변 처리 - reply_ck='Y' + 상태 변경 */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{compId}/reply")
    public ApiResponse<ComplainResponse> createReply(
            @PathVariable("compId") Integer compId,
            @RequestBody ComplainReplyRequest request
    ) {
        return ApiResponse.ok(complainService.createReply(compId, request));
    }

    /** 민원 삭제 */
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT')")
    @DeleteMapping("/{compId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("compId") Integer compId
    ) {
        if (!isAdmin(authUser)) {
            ComplainResponse existing = complainService.get(compId);
            if (!requireUserId(authUser).equals(existing.getUserId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }
        complainService.delete(compId);
        return ApiResponse.ok();
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }

    private boolean isAdmin(AuthUser authUser) {
        return authUser != null && "admin".equalsIgnoreCase(authUser.getRole());
    }
}
