package org.myweb.uniplace.domain.payment.api.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentResponse {

    private Integer paymentId;
    private String status;
    private LocalDateTime paidAt;
}