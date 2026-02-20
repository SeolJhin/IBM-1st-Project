package org.myweb.uniplace.domain.commoncode.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.commoncode.domain.entity.CommonCode;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommonCodeResponse {

    private String groupCode;
    private String code;
    private String codeValue;
    private String description;
    private Integer displayOrder;
    private Integer isActive;
    private LocalDateTime createdAt;

    public static CommonCodeResponse fromEntity(CommonCode e) {
        return CommonCodeResponse.builder()
                .groupCode(e.getGroupCode())
                .code(e.getCode())
                .codeValue(e.getCodeValue())
                .description(e.getDescription())
                .displayOrder(e.getDisplayOrder())
                .isActive(e.getIsActive())
                .createdAt(e.getCreatedAt())
                .build();
    }
}