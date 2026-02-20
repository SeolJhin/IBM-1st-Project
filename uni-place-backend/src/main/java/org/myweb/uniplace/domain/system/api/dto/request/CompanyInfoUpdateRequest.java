package org.myweb.uniplace.domain.system.api.dto.request;

import lombok.Getter;

@Getter
public class CompanyInfoUpdateRequest {
    private String companyNm;
    private String companyCeo;
    private String businessNo;
    private String companyTel;
    private String companyEmail;
    private String companyAddr;
}