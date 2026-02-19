package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "building")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")           // DB: building_id INT AUTO_INCREMENT
    private Integer id;

    @Column(name = "building_nm", nullable = false, length = 50)
    private String name;

    @Column(name = "building_addr", nullable = false, length = 500)
    private String address;

    @Column(name = "building_desc", length = 500)
    private String description;

    @Column(name = "land_category", length = 20)
    private String landCategory;

    @Column(name = "build_size", precision = 5, scale = 2) // DB: DECIMAL(5,2)
    private BigDecimal buildSize;

    @Column(name = "building_usage", length = 20)
    private String buildingUsage;

    // DB: exist_elv CHAR(1)  -> validate 충돌 방지 위해 CHAR로 강제
    @Column(name = "exist_elv", columnDefinition = "CHAR(1)")
    private String existElv;

    @Column(name = "parking_capacity")
    private Integer parkingCapacity;
=======
import org.myweb.uniplace.global.common.ActivateEntity;
import org.myweb.uniplace.domain.property.domain.enums.BuildingStatus;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "building",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "buildingNm") // 유니크 지정
    }
)
public class Building extends ActivateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer buildingId;

    @Column(nullable = false, unique = true)
    private String buildingNm;

    @Column(nullable = false)
    private String buildingAddr;

    private String buildingDesc;

    @Enumerated(EnumType.STRING)
    private BuildingStatus buildingStatus;

    private BigDecimal latitude;
    private BigDecimal longitude;

    private Integer totalFloor;       // 층수
    private Integer parkingCapacity;  // 주차 가능 대수
>>>>>>> 6cbc3d923ff3828d726500bea6261beb54147178
}
