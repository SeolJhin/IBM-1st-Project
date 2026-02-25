package org.myweb.uniplace.domain.commoncode.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commoncode.api.dto.request.CommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.request.GroupCommonCodeCreateRequest;
import org.myweb.uniplace.domain.commoncode.api.dto.response.CommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.api.dto.response.GroupCommonCodeResponse;
import org.myweb.uniplace.domain.commoncode.application.CommonCodeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/common-codes")
public class CommonCodeController {

    private final CommonCodeService commonCodeService;

    // =========================
    // 조회 (admin)
    // =========================

    // ✅ 활성 그룹 목록
    @GetMapping("/groups")
    public ApiResponse<List<GroupCommonCodeResponse>> groups() {
        return ApiResponse.ok(commonCodeService.getActiveGroups());
    }

    // ✅ 특정 그룹의 "활성 코드" 목록
    @GetMapping("/{groupCode}")
    public ApiResponse<List<CommonCodeResponse>> activeCodes(@PathVariable("groupCode") String groupCode) {
        return ApiResponse.ok(commonCodeService.getActiveCodes(groupCode));
    }

    // ✅ 특정 그룹의 "전체 코드(활성/비활성 포함)" 목록
    @GetMapping("/{groupCode}/all")
    public ApiResponse<List<CommonCodeResponse>> allCodes(@PathVariable("groupCode") String groupCode) {
        return ApiResponse.ok(commonCodeService.getAllCodes(groupCode));
    }

    // =========================
    // 생성 (admin)
    // =========================

    // ✅ 그룹 생성
    @PostMapping("/groups")
    public ApiResponse<Void> createGroup(@RequestBody GroupCommonCodeCreateRequest request) {
        commonCodeService.createGroup(request);
        return ApiResponse.ok();
    }

    // ✅ 코드 생성
    @PostMapping
    public ApiResponse<Void> createCode(@RequestBody CommonCodeCreateRequest request) {
        commonCodeService.createCode(request);
        return ApiResponse.ok();
    }

    // =========================
    // 활성/비활성 (admin)
    // =========================

    // ✅ 그룹 활성/비활성
    @PatchMapping("/groups/{groupCode}/active")
    public ApiResponse<Void> changeGroupActive(@PathVariable("groupCode") String groupCode, @RequestParam(name = "isActive") boolean active) {
        commonCodeService.changeGroupActive(groupCode, active);
        return ApiResponse.ok();
    }

    // ✅ 코드 활성/비활성
    @PatchMapping("/{code}/active")
    public ApiResponse<Void> changeCodeActive(@PathVariable("code") String code, @RequestParam(name = "isActive") boolean active) {
        commonCodeService.changeCodeActive(code, active);
        return ApiResponse.ok();
    }
}