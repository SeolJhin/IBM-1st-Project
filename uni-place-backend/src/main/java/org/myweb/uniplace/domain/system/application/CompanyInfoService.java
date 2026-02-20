package org.myweb.uniplace.domain.system.application;

import org.myweb.uniplace.domain.system.api.dto.request.CompanyInfoUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;

public interface CompanyInfoService {
    CompanyInfoResponse getLatest();
    CompanyInfoResponse update(Integer companyId, CompanyInfoUpdateRequest request);
}