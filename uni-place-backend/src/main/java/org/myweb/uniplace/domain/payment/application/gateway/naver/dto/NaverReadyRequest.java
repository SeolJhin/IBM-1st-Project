package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NaverReadyRequest {

    @JsonProperty("merchantPayKey")
    private String merchantPayKey;

    @JsonProperty("merchantUserKey")
    private String merchantUserKey;

    @JsonProperty("productName")
    private String productName;

    @JsonProperty("productCount")
    private Integer productCount;

    @JsonProperty("totalPayAmount")
    private Integer totalPayAmount;

    @JsonProperty("taxScopeAmount")
    private Integer taxScopeAmount;

    @JsonProperty("taxExScopeAmount")
    private Integer taxExScopeAmount;

    @JsonProperty("returnUrl")
    private String returnUrl;

    @JsonProperty("purchaserName")
    private String purchaserName; // optional

    @JsonProperty("purchaserBirthday")
    private String purchaserBirthday; // optional
}
