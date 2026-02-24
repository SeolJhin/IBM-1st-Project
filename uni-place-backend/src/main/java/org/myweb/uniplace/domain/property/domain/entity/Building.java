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
    // ✅ SoftDeleteEntity 상속으로 아래 필드/메서드 자동 제공
    //    - deleteYn (CHAR(1), 기본값 'N')
    //    - softDelete()   → deleteYn = 'Y'
    //    - isDeleted()    → "Y".equals(deleteYn)
    //    - createdAt / updatedAt (BaseTimeEntity 경유)

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

    // ✅ CascadeType.ALL + orphanRemoval 제거
    //    이유: soft delete 방식에서 JPA cascade로 Room이 hard delete 되는 것을 방지
    //    Building soft delete 시 Room 처리는 BuildingServiceImpl.deleteBuilding()에서 직접 수행
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
            Integer parkingCapacity
    ) {
        if (buildingNm != null)      this.buildingNm = buildingNm;
        if (buildingAddr != null)    this.buildingAddr = buildingAddr;
        if (buildingDesc != null)    this.buildingDesc = buildingDesc;
        if (landCategory != null)    this.landCategory = landCategory;
        if (buildSize != null)       this.buildSize = buildSize;
        if (buildingUsage != null)   this.buildingUsage = buildingUsage;
        if (existElv != null)        this.existElv = existElv;
        if (parkingCapacity != null) this.parkingCapacity = parkingCapacity;
    }
}
