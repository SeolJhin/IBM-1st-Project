package org.myweb.uniplace.domain.affiliate.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "affiliate",
        indexes = {
                @Index(name = "ix_affiliate_building", columnList = "building_id"),
                @Index(name = "ix_affiliate_code", columnList = "code")
        }
)
public class Affiliate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "affiliate_id")
    private Integer affiliateId;

    @Column(name = "building_id", nullable = false)
    private Integer buildingId;

    @Column(name = "affiliate_nm", nullable = false, length = 50)
    private String affiliateNm;

    @Column(name = "affiliate_ceo", length = 50)
    private String affiliateCeo;

    @Column(name = "affiliate_tel", length = 30)
    private String affiliateTel;

    @Column(name = "business_no", length = 50)
    private String businessNo;

    @Column(name = "affiliate_fax", length = 30)
    private String affiliateFax;

    @Column(name = "affiliate_email", length = 100)
    private String affiliateEmail;

    @Column(name = "affiliate_addr", length = 500)
    private String affiliateAddr;

    @Column(name = "affiliate_start_at")
    private LocalDateTime affiliateStartAt;

    @Column(name = "affiliate_end_at")
    private LocalDateTime affiliateEndAt;

    /** common_code.code (AFFILIATE_CATEGORY) */
    @Column(name = "code", length = 20)
    private String code;

    @Column(name = "affiliate_desc", length = 3000)
    private String affiliateDesc;

    @Enumerated(EnumType.STRING)
    @Column(name = "affiliate_st")
    private AffiliateStatus affiliateSt;

    @PrePersist
    public void prePersist() {
        if (affiliateSt == null) affiliateSt = AffiliateStatus.planned;
    }
    
    // 관리자용
    public void update(
            Integer buildingId,
            String affiliateNm,
            String affiliateCeo,
            String affiliateTel,
            String businessNo,
            String affiliateFax,
            String affiliateEmail,
            String affiliateAddr,
            LocalDateTime affiliateStartAt,
            LocalDateTime affiliateEndAt,
            String code,
            String affiliateDesc,
            AffiliateStatus affiliateSt
    ) {
        if (buildingId != null) this.buildingId = buildingId;
        if (affiliateNm != null) this.affiliateNm = affiliateNm;
        if (affiliateCeo != null) this.affiliateCeo = affiliateCeo;
        if (affiliateTel != null) this.affiliateTel = affiliateTel;
        if (businessNo != null) this.businessNo = businessNo;
        if (affiliateFax != null) this.affiliateFax = affiliateFax;
        if (affiliateEmail != null) this.affiliateEmail = affiliateEmail;
        if (affiliateAddr != null) this.affiliateAddr = affiliateAddr;
        if (affiliateStartAt != null) this.affiliateStartAt = affiliateStartAt;
        if (affiliateEndAt != null) this.affiliateEndAt = affiliateEndAt;
        if (code != null) this.code = code;
        if (affiliateDesc != null) this.affiliateDesc = affiliateDesc;
        if (affiliateSt != null) this.affiliateSt = affiliateSt;
    }
}
