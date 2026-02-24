package org.myweb.uniplace.domain.contract.domain.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.user.domain.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "contract")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Integer contractId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "contract_start", nullable = false)
    private LocalDate contractStart;

    @Column(name = "contract_end", nullable = false)
    private LocalDate contractEnd;

    @Column(name = "deposit", precision = 12, scale = 0)
    private BigDecimal deposit;

    @Column(name = "rent_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal rentPrice;

    @Column(name = "manage_fee", precision = 12, scale = 0)
    private BigDecimal manageFee;

    @Column(name = "payment_day", nullable = false)
    private Integer paymentDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_st", nullable = false, length = 20)
    private ContractStatus contractSt;

    @Column(name = "sign_at")
    private LocalDateTime signAt;

    @Column(name = "movein_at")
    private LocalDateTime moveinAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "rent_type", nullable = false, length = 20)
    private RentType rentType;

    // ===== ✅ 회원이 입력하는 임대인 정보 =====
    @Column(name = "lessor_nm", length = 50, nullable = false)
    private String lessorNm;

    @Column(name = "lessor_tel", length = 20, nullable = false)
    private String lessorTel;

    @Column(name = "lessor_addr", length = 100, nullable = false)
    private String lessorAddr;

    @Column(name = "lessor_rrn", length = 20, nullable = false)
    private String lessorRrn;

    // ===== ✅ 대표 파일 포인터(files.file_id) =====
    @Column(name = "lessor_sign_file_id")
    private Integer lessorSignFileId;

    @Column(name = "contract_pdf_file_id")
    private Integer contractPdfFileId;

    @PrePersist
    public void prePersist() {
        if (contractSt == null) contractSt = ContractStatus.requested;
        if (rentType == null) rentType = RentType.monthly_rent;
        if (paymentDay == null) paymentDay = 1;
    }

    public enum RentType {
        monthly_rent,
        stay
    }
}