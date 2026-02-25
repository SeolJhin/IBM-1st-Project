package org.myweb.uniplace.domain.commoncode.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupCommonCodeCreateRequest {

    private String groupCode;        // PK
    private String groupCodeName;    // unique
    private String description;
    private Integer isActive;        // 1/0 (없으면 1)
}