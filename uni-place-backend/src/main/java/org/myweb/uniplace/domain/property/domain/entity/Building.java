// 경로: org/myweb/uniplace/domain/property/domain/entity/Building.java
package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.common.SoftDeleteEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "building")
public class Building extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")
    private Integer buildingId;

    @Column(name = "building_nm", nullable = false, length = 50)
    private String buildingNm;

    @Column(name = "building_addr", nullable = false, length = 500)
    private String buildingAddr;

    @Column(name = "building_desc", length = 500)
    private String buildingDesc;

    @Column(name = "land_category", length = 20)
    private String landCategory;

    @Column(name = "build_size", precision = 5, scale = 2)
    private BigDecimal buildSize;

    @Column(name = "building_usage", length = 20)
    private String buildingUsage;

    @Column(name = "exist_elv", length = 1)
    private String existElv;

    @Column(name = "parking_capacity")
    private Integer parkingCapacity;

    // ✅ 임대인 정보 (어드민이 건물 등록 시 입력)
    @Column(name = "building_lessor_nm", length = 50)
    private String buildingLessorNm;

    @Column(name = "building_lessor_tel", length = 20)
    private String buildingLessorTel;

    @Column(name = "building_lessor_addr", length = 200)
    private String buildingLessorAddr;

    @Column(name = "building_lessor_rrn", length = 20)
    private String buildingLessorRrn;

    @OneToMany(
            mappedBy = "building",
            cascade = {CascadeType.PERSIST, CascadeType.MERGE},
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();

    public void update(
            String buildingNm,
            String buildingAddr,
            String buildingDesc,
            String landCategory,
            BigDecimal buildSize,
            String buildingUsage,
            String existElv,
            Integer parkingCapacity,
            String buildingLessorNm,
            String buildingLessorTel,
            String buildingLessorAddr,
            String buildingLessorRrn
    ) {
        if (buildingNm != null)          this.buildingNm = buildingNm;
        if (buildingAddr != null)        this.buildingAddr = buildingAddr;
        if (buildingDesc != null)        this.buildingDesc = buildingDesc;
        if (landCategory != null)        this.landCategory = landCategory;
        if (buildSize != null)           this.buildSize = buildSize;
        if (buildingUsage != null)       this.buildingUsage = buildingUsage;
        if (existElv != null)            this.existElv = existElv;
        if (parkingCapacity != null)     this.parkingCapacity = parkingCapacity;
        if (buildingLessorNm != null)    this.buildingLessorNm = buildingLessorNm;
        if (buildingLessorTel != null)   this.buildingLessorTel = buildingLessorTel;
        if (buildingLessorAddr != null)  this.buildingLessorAddr = buildingLessorAddr;
        if (buildingLessorRrn != null)   this.buildingLessorRrn = buildingLessorRrn;
    }
}
