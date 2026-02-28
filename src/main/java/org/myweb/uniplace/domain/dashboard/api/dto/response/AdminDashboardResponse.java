package org.myweb.uniplace.domain.dashboard.api.dto.response;

public record AdminDashboardResponse(
    long residentCount,
    long facilityCount,
    long tourCount,
    long contractCount,
    long bannerViewCount,
    long roomServiceOrderCount
) {
}

