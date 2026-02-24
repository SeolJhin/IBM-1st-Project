// 경로: org/myweb/uniplace/domain/property/api/dto/request/SpaceCreateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpaceCreateRequest {

    @NotBlank(message = "buildingNm은 필수입니다.")
    private String buildingNm;

    @NotBlank(message = "spaceNm은 필수입니다.")
    private String spaceNm;

    @NotNull(message = "spaceFloor는 필수입니다.")
    private Integer spaceFloor;

    private Integer spaceCapacity;
    private String spaceOptions;
    private String spaceDesc;

    //파일 업로드(선택)
    private List<MultipartFile> files;
}