package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentResponse {

    private Integer paymentId;
    private String paymentSt;
    private LocalDateTime paidAt;
    
    // 카카오 ready 결과
    private String providerRefId;       // tid
    private String redirectPcUrl;
    private String redirectMobileUrl;
    private String redirectAppUrl;
    
}