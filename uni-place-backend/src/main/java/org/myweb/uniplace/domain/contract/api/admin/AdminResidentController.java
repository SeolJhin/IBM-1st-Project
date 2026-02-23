package org.myweb.uniplace.domain.contract.api.admin;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.response.ResidentResponse;
import org.myweb.uniplace.domain.contract.application.ResidentService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/residents")
public class AdminResidentController {

    private final ResidentService residentService;

    /**
     * 거주자 목록(관리자)
     * GET /admin/residents
     */
    @GetMapping
    public ApiResponse<List<ResidentResponse>> getResidentList() {
        return ApiResponse.ok(residentService.getResidentList());
    }
}