package org.myweb.uniplace.domain.commoncode.api.dto.response;

import lombok.*;
import org.myweb.uniplace.domain.commoncode.domain.entity.GroupCommonCode;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupCommonCodeResponse {

    private String groupCode;
    private String groupCodeName;
    private String description;
    private Integer isActive;
    private LocalDateTime createdAt;

    public static GroupCommonCodeResponse fromEntity(GroupCommonCode e) {
        return GroupCommonCodeResponse.builder()
                .groupCode(e.getGroupCode())
                .groupCodeName(e.getGroupCodeName())
                .description(e.getDescription())
                .isActive(e.getIsActive())
                .createdAt(e.getCreatedAt())
                .build();
    }
}