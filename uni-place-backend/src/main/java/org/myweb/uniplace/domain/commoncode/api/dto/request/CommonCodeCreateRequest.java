package org.myweb.uniplace.domain.commoncode.api.dto.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommonCodeCreateRequest {

    private String groupCode;     // FK
    private String code;          // PK(전역 유니크)
    private String codeValue;
    private String description;
    private Integer displayOrder;
    private Integer isActive;     // 1/0 (없으면 1)
}