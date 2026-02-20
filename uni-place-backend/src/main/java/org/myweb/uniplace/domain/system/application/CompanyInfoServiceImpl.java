package org.myweb.uniplace.domain.system.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.request.CompanyInfoUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;
import org.myweb.uniplace.domain.system.domain.entity.CompanyInfo;
import org.myweb.uniplace.domain.system.repository.CompanyInfoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyInfoServiceImpl implements CompanyInfoService {

    private final CompanyInfoRepository companyInfoRepository;

    @Override
    public CompanyInfoResponse getLatest() {
        CompanyInfo company = companyInfoRepository.findTopByOrderByCompanyIdDesc()
                .orElseThrow(() -> new IllegalArgumentException("회사정보가 등록되어 있지 않습니다."));
        return CompanyInfoResponse.from(company);
    }

    @Override
    @Transactional
    public CompanyInfoResponse update(Integer companyId, CompanyInfoUpdateRequest request) {
        CompanyInfo company = companyInfoRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("회사정보를 찾을 수 없습니다. companyId=" + companyId));

        company.update(
                request.getCompanyNm(),
                request.getCompanyCeo(),
                request.getBusinessNo(),
                request.getCompanyTel(),
                request.getCompanyEmail(),
                request.getCompanyAddr()
        );

        return CompanyInfoResponse.from(company);
    }
}