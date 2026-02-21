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

    // DB 컬럼명: `desc`
    @Column(name = "`desc`", length = 255)
    private String desc;

    @Column(name = "is_terminal", nullable = false)
    private Integer isTerminal;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Integer isActive = 1;
}