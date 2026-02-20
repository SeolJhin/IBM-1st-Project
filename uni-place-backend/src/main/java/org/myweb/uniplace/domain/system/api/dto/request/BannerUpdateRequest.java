package org.myweb.uniplace.domain.system.api.dto.request;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerUpdateRequest {

    private LocalDateTime startAt;
    private LocalDateTime endAt;

    private String banTitle;

    // ✅ 클릭 시 이동할 임의 URL
    private String banUrl;

    private Integer banOrder;
}