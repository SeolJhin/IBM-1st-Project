package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;
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
    private Long buildingId;

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
}
