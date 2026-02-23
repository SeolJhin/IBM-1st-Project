package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentPrepareResponse {

    private Integer paymentId;
    private String merchantUid;
    private String paymentSt;
    
    
    // kakao ready 응답에서 내려주는 결제창 URL (최소 PC만)
    private String redirectPcUrl;
    
    private String redirectMobileUrl;
    private String redirectAppUrl;
    private String providerRefId;
    
}
