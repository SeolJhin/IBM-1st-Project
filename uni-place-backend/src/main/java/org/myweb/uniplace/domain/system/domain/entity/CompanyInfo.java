package org.myweb.uniplace.domain.system.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "company_info")
public class CompanyInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "company_nm", nullable = false, length = 100)
    private String companyNm;

    @Column(name = "company_ceo", length = 50)
    private String companyCeo;

    @Column(name = "business_no", length = 50)
    private String businessNo;

    @Column(name = "company_tel", length = 30)
    private String companyTel;

    @Column(name = "company_email", length = 100)
    private String companyEmail;

    @Column(name = "company_addr", length = 500)
    private String companyAddr;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(
            String companyNm,
            String companyCeo,
            String businessNo,
            String companyTel,
            String companyEmail,
            String companyAddr
    ) {
        if (companyNm != null) this.companyNm = companyNm;
        if (companyCeo != null) this.companyCeo = companyCeo;
        if (businessNo != null) this.businessNo = businessNo;
        if (companyTel != null) this.companyTel = companyTel;
        if (companyEmail != null) this.companyEmail = companyEmail;
        if (companyAddr != null) this.companyAddr = companyAddr;
    }
}