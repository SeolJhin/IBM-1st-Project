package org.myweb.uniplace.domain.affiliate.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.affiliate.domain.entity.Affiliate;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class AffiliateResponse {

    private Integer affiliateId;
    private Integer buildingId;

    private String affiliateNm;
    private String affiliateCeo;
    private String affiliateTel;
    private String businessNo;
    private String affiliateFax;
    private String affiliateEmail;
    private String affiliateAddr;

    private LocalDateTime affiliateStartAt;
    private LocalDateTime affiliateEndAt;

    private String code;
    private String affiliateDesc;

    private AffiliateStatus affiliateSt;

    public static AffiliateResponse from(Affiliate a) {
        return AffiliateResponse.builder()
                .affiliateId(a.getAffiliateId())
                .buildingId(a.getBuildingId())
                .affiliateNm(a.getAffiliateNm())
                .affiliateCeo(a.getAffiliateCeo())
                .affiliateTel(a.getAffiliateTel())
                .businessNo(a.getBusinessNo())
                .affiliateFax(a.getAffiliateFax())
                .affiliateEmail(a.getAffiliateEmail())
                .affiliateAddr(a.getAffiliateAddr())
                .affiliateStartAt(a.getAffiliateStartAt())
                .affiliateEndAt(a.getAffiliateEndAt())
                .code(a.getCode())
                .affiliateDesc(a.getAffiliateDesc())
                .affiliateSt(a.getAffiliateSt())
                .build();
    }
}
