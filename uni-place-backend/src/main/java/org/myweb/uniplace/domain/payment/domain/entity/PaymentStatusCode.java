package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_status")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentStatusCode {

    @Id
    @Column(name = "status_cd", length = 20)
    private String statusCd;

    @Column(name = "desc")
    private String description;

    @Column(name = "is_terminal", nullable = false)
    private Integer isTerminal;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private Integer isActive;
}