package org.myweb.uniplace.domain.property.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.property.application.PropertyDashboardService;
import org.myweb.uniplace.domain.property.api.dto.response.PropertyDashboardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/property")
@RequiredArgsConstructor
public class AdminPropertyDashboardController {

    private final PropertyDashboardService propertyDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<PropertyDashboardResponse> getDashboard(
            @RequestParam("buildingId") Integer buildingId
    ) {
    	PropertyDashboardResponse response =
    			propertyDashboardService.getDashboard(buildingId);

        return ResponseEntity.ok(response);
    }
}