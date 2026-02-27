package org.myweb.uniplace.domain.user.api.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.application.UserService;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserService userService;

    /**
     * ✅ 관리자 - 회원 목록 조회 (페이지네이션)
     * GET /admin/users?page=1&size=10&sort=userId&direct=DESC
     */
    @GetMapping
    public ApiResponse<PageResponse<UserResponse>> list(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "userId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        // ✅ 서비스에서 Page<UserResponse>로 돌려주게 만들기
        Page<UserResponse> result = userService.listForAdmin(pageable);

        return ApiResponse.ok(PageResponse.of(result));
    }

    // 관리자 - 단건 조회
    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> get(@PathVariable("userId") String userId) {
        return ApiResponse.ok(userService.getByIdForAdmin(userId));
    }

    // 관리자 - 회원 상태 변경
    @PatchMapping("/{userId}/status")
    public ApiResponse<UserResponse> updateStatus(
            @PathVariable("userId") String userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest req
    ) {
        return ApiResponse.ok(userService.updateStatus(userId, req));
    }

    // 관리자 - 회원 권한 변경
    @PatchMapping("/{userId}/role")
    public ApiResponse<UserResponse> updateRole(
            @PathVariable("userId") String userId,
            @Valid @RequestBody AdminUserRoleUpdateRequest req
    ) {
        return ApiResponse.ok(userService.updateRole(userId, req));
    }
}