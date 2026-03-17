package org.myweb.uniplace.domain.payment.application.gateway.naver.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NaverHistoryByPaymentRequest {

    @JsonProperty("approvalType")
    private String approvalType;

    @JsonProperty("pageNumber")
    private Integer pageNumber;

    @JsonProperty("rowsPerPage")
    private Integer rowsPerPage;

    @JsonProperty("collectChainGroup")
    private Integer collectChainGroup;
}
