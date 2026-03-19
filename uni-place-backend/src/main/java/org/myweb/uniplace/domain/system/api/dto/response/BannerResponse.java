package org.myweb.uniplace.domain.system.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.system.domain.entity.Banner;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannerResponse {

    private Integer banId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String banTitle;
    private String banUrl;
    private Integer banOrder;
    private String banSt;
    private List<FileResponse> files;

    // 대표 이미지 URL (환경에 따라 로컬 /files/{id}/view or S3 URL)
    private String imageUrl;

    public static BannerResponse fromEntity(Banner e, List<FileResponse> files) {
        // FileResponse.viewUrl 이 이미 환경에 맞는 URL을 담고 있음
        String imageUrl = null;
        if (files != null && !files.isEmpty() && files.get(0) != null) {
            imageUrl = files.get(0).getViewUrl();
        }

        return BannerResponse.builder()
                .banId(e.getBanId())
                .startAt(e.getStartAt())
                .endAt(e.getEndAt())
                .banTitle(e.getBanTitle())
                .banUrl(e.getBanUrl())
                .banOrder(e.getBanOrder())
                .banSt(e.getBanSt().name())
                .files(files)
                .imageUrl(imageUrl)
                .build();
    }
}