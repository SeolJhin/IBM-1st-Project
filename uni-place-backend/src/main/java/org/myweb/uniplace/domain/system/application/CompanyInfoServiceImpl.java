package org.myweb.uniplace.domain.system.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.system.api.dto.request.CompanyInfoUpdateRequest;
import org.myweb.uniplace.domain.system.api.dto.response.CompanyInfoResponse;
import org.myweb.uniplace.domain.system.domain.entity.CompanyInfo;
import org.myweb.uniplace.domain.system.repository.CompanyInfoRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
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
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_INFO_NOT_FOUND));
        return CompanyInfoResponse.from(company);
    }

    @Override
    @Transactional
    public CompanyInfoResponse update(Integer companyId, CompanyInfoUpdateRequest request) {
        CompanyInfo company = companyInfoRepository.findById(companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_INFO_NOT_FOUND));

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