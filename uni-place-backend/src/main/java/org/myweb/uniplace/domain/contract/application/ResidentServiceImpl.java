package org.myweb.uniplace.domain.contract.application;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.response.ResidentResponse;
import org.myweb.uniplace.domain.contract.domain.entity.Resident;
import org.myweb.uniplace.domain.contract.repository.ResidentRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResidentServiceImpl implements ResidentService {

    private final ResidentRepository residentRepository;

    @Override
    public List<ResidentResponse> getResidentList() {
        List<Resident> list = residentRepository.findAll();
        return list.stream()
                .map(ResidentResponse::fromEntity)
                .toList();
    }
}