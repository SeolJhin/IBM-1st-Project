package org.myweb.uniplace.domain.affiliate.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.affiliate.domain.entity.Affiliate;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class AffiliateSummaryResponse {

    private Integer affiliateId;
    private Integer buildingId;

    private String affiliateNm;
    private String affiliateTel;

    private String code;
    private AffiliateStatus affiliateSt;

    private LocalDateTime affiliateStartAt;
    private LocalDateTime affiliateEndAt;

    public static AffiliateSummaryResponse from(Affiliate a) {
        return AffiliateSummaryResponse.builder()
                .affiliateId(a.getAffiliateId())
                .buildingId(a.getBuildingId())
                .affiliateNm(a.getAffiliateNm())
                .affiliateTel(a.getAffiliateTel())
                .code(a.getCode())
                .affiliateSt(a.getAffiliateSt())
                .affiliateStartAt(a.getAffiliateStartAt())
                .affiliateEndAt(a.getAffiliateEndAt())
                .build();
    }
}
