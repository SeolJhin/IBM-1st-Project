// 경로: org/myweb/uniplace/domain/property/api/dto/request/RoomStatusUpdateRequest.java
package org.myweb.uniplace.domain.property.api.dto.request;

import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
public class RoomStatusUpdateRequest {

    @NotNull(message = "roomStatus는 필수입니다.")
    private RoomStatus roomStatus;
}