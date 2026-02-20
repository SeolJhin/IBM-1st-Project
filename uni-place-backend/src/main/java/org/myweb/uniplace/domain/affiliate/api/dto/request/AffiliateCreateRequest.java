package org.myweb.uniplace.domain.affiliate.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

import java.time.LocalDateTime;

@Getter
public class AffiliateCreateRequest {

    @NotNull(message = "건물아이디(buildingId)는 필수입니다.")
    private Integer buildingId;

    @NotBlank(message = "제휴업체명(affiliateNm)은 필수입니다.")
    private String affiliateNm;

    private String affiliateCeo;
    private String affiliateTel;
    private String businessNo;
    private String affiliateFax;

    @Email(message = "이메일(affiliateEmail) 형식이 올바르지 않습니다.")
    private String affiliateEmail;

    private String affiliateAddr;

    private LocalDateTime affiliateStartAt;
    private LocalDateTime affiliateEndAt;

    /** common_code.code (AFFILIATE_CATEGORY) */
    private String code;

    private String affiliateDesc;

    private AffiliateStatus affiliateSt;
}
