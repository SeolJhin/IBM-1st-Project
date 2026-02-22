package org.myweb.uniplace.domain.billing.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "charge_status")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChargeStatusCode {

    @Id
    @Column(name = "status_cd", length = 20)
    private String statusCd;

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
