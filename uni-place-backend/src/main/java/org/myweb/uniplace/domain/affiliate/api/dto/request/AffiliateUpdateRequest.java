package org.myweb.uniplace.domain.affiliate.api.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

import java.time.LocalDateTime;

@Getter
public class AffiliateUpdateRequest {

    private Integer buildingId;

    private String affiliateNm;
    private String affiliateCeo;
    private String affiliateTel;
    private String businessNo;
    private String affiliateFax;

    @Email
    private String affiliateEmail;

    private String affiliateAddr;

    private LocalDateTime affiliateStartAt;
    private LocalDateTime affiliateEndAt;

    private String code;
    private String affiliateDesc;

    private AffiliateStatus affiliateSt;
}
