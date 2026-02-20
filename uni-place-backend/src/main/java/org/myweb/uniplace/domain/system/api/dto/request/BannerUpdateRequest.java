package org.myweb.uniplace.domain.system.api.dto.request;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BannerUpdateRequest {
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String banTitle;
    private String banUrl;
    private Integer banOrder;
    private String banSt; // "active" / "inactive"
}