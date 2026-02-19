// 경로: org.myweb.uniplace.domain.property.domain.entity.Building

package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.common.BaseTimeEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "building",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_building_nm",
                        columnNames = "building_nm"
                )
        }
)
public class Building extends BaseTimeEntity {

    /* =========================
       기본 PK
     ========================= */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")
    private Integer buildingId;


    /* =========================
       기본 정보
     ========================= */
    @Column(name = "building_nm", nullable = false, length = 50)
    private String buildingNm;

    @Column(name = "building_addr", nullable = false, length = 500)
    private String buildingAddr;

    @Column(name = "building_desc", length = 500)
    private String buildingDesc;


    /* =========================
       계약서용 확장 정보
     ========================= */

    // 지목
    @Column(name = "land_category", length = 20)
    private String landCategory;

    // 면적
    @Column(name = "build_size", precision = 5, scale = 2)
    private BigDecimal buildSize;

    // 건물 용도
    @Column(name = "building_usage", length = 20)
    private String buildingUsage;

    // 엘리베이터 유무 (Y/N)
    @Column(name = "exist_elv", length = 1)
    private String existElv;

    // 주차 가능 대수
    @Column(name = "parking_capacity")
    private Integer parkingCapacity;


    /* =========================
       연관관계 (Room)
     ========================= */

    @OneToMany(
            mappedBy = "building",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<Room> rooms = new ArrayList<>();


    /* =========================
       비즈니스 메서드
     ========================= */

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
        if (buildingNm != null) this.buildingNm = buildingNm;
        if (buildingAddr != null) this.buildingAddr = buildingAddr;
        if (buildingDesc != null) this.buildingDesc = buildingDesc;
        if (landCategory != null) this.landCategory = landCategory;
        if (buildSize != null) this.buildSize = buildSize;
        if (buildingUsage != null) this.buildingUsage = buildingUsage;
        if (existElv != null) this.existElv = existElv;
        if (parkingCapacity != null) this.parkingCapacity = parkingCapacity;
    }
    
    
}
