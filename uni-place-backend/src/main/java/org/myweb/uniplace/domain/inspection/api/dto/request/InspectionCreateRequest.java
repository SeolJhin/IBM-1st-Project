package org.myweb.uniplace.domain.inspection.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InspectionCreateRequest {

    /** 점검 대상 공간 종류 (room / building / common_space) */
    @NotBlank(message = "공간 종류(spaceType)는 필수입니다.")
    private String spaceType;

    /** 공간 ID (room_id / building_id / space_id) */
    @NotNull(message = "공간 ID(spaceId)는 필수입니다.")
    private Integer spaceId;

    /** 점검 메모 (선택) */
    private String inspectionMemo;
}
