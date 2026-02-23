package org.myweb.uniplace.domain.payment.application.gateway.toss.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TossCancelRequest {

    @JsonProperty("cancelReason")
    private String cancelReason;

    @JsonProperty("cancelAmount")
    private Integer cancelAmount;
}
