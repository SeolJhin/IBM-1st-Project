package org.myweb.uniplace.domain.system.api.dto.response;

import org.myweb.uniplace.domain.system.domain.entity.Banner;

import java.time.LocalDateTime;

public record BannerResponse(
        Integer banId,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String banTitle,
        String banUrl,
        Integer banOrder,
        String banSt
) {
    public static BannerResponse from(Banner e) {
        return new BannerResponse(
                e.getBanId(),
                e.getStartAt(),
                e.getEndAt(),
                e.getBanTitle(),
                e.getBanUrl(),
                e.getBanOrder(),
                e.getBanSt().name()
        );
    }
}