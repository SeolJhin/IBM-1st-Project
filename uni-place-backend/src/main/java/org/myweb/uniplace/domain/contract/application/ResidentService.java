package org.myweb.uniplace.domain.contract.application;

import java.util.List;

import org.myweb.uniplace.domain.contract.api.dto.request.ResidentCreateRequest;
import org.myweb.uniplace.domain.contract.api.dto.response.ResidentResponse;

public interface ResidentService {
    List<ResidentResponse> getResidentList();
    ResidentResponse createResident(ResidentCreateRequest request);
}