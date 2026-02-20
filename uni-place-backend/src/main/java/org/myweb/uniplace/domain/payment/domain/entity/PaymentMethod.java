package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_method",
       uniqueConstraints = {
           @UniqueConstraint(name = "uq_payment_method_code", columnNames = "payment_method_cd")
       })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_method_id")
    private Integer paymentMethodId;

    @Column(name = "payment_method_nm", nullable = false)
    private String paymentMethodName;

    @Column(name = "payment_method_cd", nullable = false)
    private String paymentMethodCode;

    @Column(name = "is_active", nullable = false)
    private Integer isActive;
}