package org.myweb.uniplace.domain.dashboard.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.dashboard.api.dto.response.AdminDashboardResponse;
import org.myweb.uniplace.domain.dashboard.application.AdminDashboardService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok(adminDashboardService.getDashboard()));
    }
}

