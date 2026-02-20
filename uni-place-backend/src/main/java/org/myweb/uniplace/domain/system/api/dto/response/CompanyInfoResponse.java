package org.myweb.uniplace.domain.system.api.dto.response;

import org.myweb.uniplace.domain.system.domain.entity.CompanyInfo;

public record CompanyInfoResponse(
        Integer companyId,
        String companyNm,
        String companyCeo,
        String businessNo,
        String companyTel,
        String companyEmail,
        String companyAddr
) {
    public static CompanyInfoResponse from(CompanyInfo e) {
        return new CompanyInfoResponse(
                e.getCompanyId(),
                e.getCompanyNm(),
                e.getCompanyCeo(),
                e.getBusinessNo(),
                e.getCompanyTel(),
                e.getCompanyEmail(),
                e.getCompanyAddr()
        );
    }
}