package org.myweb.uniplace.domain.affiliate.api.dto.request;

import lombok.Getter;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

@Getter
public class AffiliateSearchRequest {

    private Integer buildingId;
    private String code;        // affiliate category (common_code.code)
    private String keyword;     // 업체명/대표자/전화 키워드
    private AffiliateStatus affiliateSt;
}
