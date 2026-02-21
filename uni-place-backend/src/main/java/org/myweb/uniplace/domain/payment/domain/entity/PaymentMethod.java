package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "payment_method",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_payment_method_code", columnNames = "payment_method_cd")
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_method_id")
    private Integer paymentMethodId;

    @Column(name = "payment_method_nm", nullable = false, length = 50)
    private String paymentMethodNm;

    @Column(name = "payment_method_cd", nullable = false, length = 20)
    private String paymentMethodCd;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Integer isActive = 1;
}