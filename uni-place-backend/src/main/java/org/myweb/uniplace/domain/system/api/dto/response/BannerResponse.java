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

    // ✅ 클릭 이동 링크(임의 URL)
    private String banUrl;

    private Integer banOrder;
    private String banSt;

    // ✅ 다형성 파일(BANNER, banId) [프론트에서 쓰는 값. 이미지 표시: banner.imageUrl 또는 banner.files[0]로 /files/{id}/view 구성]
    private List<FileResponse> files;

    // ✅ 프론트 편의: 대표 이미지 URL (/files/{fileId}/view)
    private String imageUrl;

    public static BannerResponse fromEntity(Banner e, List<FileResponse> files) {

        String imageUrl = null;
        if (files != null && !files.isEmpty() && files.get(0) != null) {
            Integer fileId = files.get(0).getFileId();
            if (fileId != null) imageUrl = "/files/" + fileId + "/view";
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