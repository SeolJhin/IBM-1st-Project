package org.myweb.uniplace.domain.contract.api.dto.response;

import org.myweb.uniplace.domain.contract.domain.entity.Resident;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResidentResponse {

    private Integer residentId;
    private Integer buildingId;
    private Integer contractId;
    private String userId;

    public static ResidentResponse fromEntity(Resident r) {
        return ResidentResponse.builder()
                .residentId(r.getResidentId())
                .buildingId(r.getBuildingId())
                .contractId(r.getContractId())
                .userId(r.getUserId())
                .build();
    }
}