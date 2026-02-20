package org.myweb.uniplace.domain.system.api.dto.request;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BannerCreateRequest {
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String banTitle;
    private String banUrl;
    private Integer banOrder;
}