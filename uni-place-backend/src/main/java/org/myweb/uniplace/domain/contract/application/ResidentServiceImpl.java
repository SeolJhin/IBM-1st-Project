package org.myweb.uniplace.domain.contract.application;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ResidentCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.ResidentResponse;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.entity.Resident;
import org.myweb.uniplace.domain.contract.repository.ContractRepository;
import org.myweb.uniplace.domain.contract.repository.ResidentRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResidentServiceImpl implements ResidentService {

    private final ResidentRepository residentRepository;
    private final ContractRepository contractRepository;

    @Override
    public List<ResidentResponse> getResidentList() {
        List<Resident> list = residentRepository.findAll();
        return list.stream()
                .map(ResidentResponse::fromEntity)
                .toList();
    }
    
    @Override
    public ResidentResponse createResident(ResidentCreateRequest request) {

        // 1) 계약 존재 + room/building fetch
        Contract c = contractRepository.findWithRoomAndBuilding(request.getContractId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        // 2) 요청값 정합성 검증 (임의로 다른 계약/유저/건물 매핑 방지)
        String contractUserId = (c.getUser() != null ? c.getUser().getUserId() : null);
        Integer contractBuildingId =
                (c.getRoom() != null && c.getRoom().getBuilding() != null)
                        ? c.getRoom().getBuilding().getBuildingId()
                        : null;

        if (contractUserId == null || !contractUserId.equals(request.getUserId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        if (contractBuildingId == null || !contractBuildingId.equals(request.getBuildingId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        // 3) 이미 있으면 그대로 반환(멱등)
        return residentRepository.findByContractIdAndUserId(request.getContractId(), request.getUserId())
                .map(ResidentResponse::fromEntity)
                .orElseGet(() -> {
                    Resident saved = residentRepository.save(
                            Resident.builder()
                                    .buildingId(request.getBuildingId())
                                    .contractId(request.getContractId())
                                    .userId(request.getUserId())
                                    .build()
                    );
                    return ResidentResponse.fromEntity(saved);
                });
    }
}