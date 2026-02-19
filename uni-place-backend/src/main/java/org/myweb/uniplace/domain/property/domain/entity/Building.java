package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "building",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_buildings_building_nm",
                        columnNames = { "building_nm" }
                )
        }
)
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id", nullable = false)
    private Integer buildingId;

    @Column(name = "building_nm", nullable = false, length = 100)
    private String buildingNm;

    @Column(name = "building_addr", nullable = false, length = 300)
    private String buildingAddr;

    @Column(name = "building_desc", length = 3000)
    private String buildingDesc;

    @Column(name = "parking_capacity")
    private Integer parkingCapacity;

    @PrePersist
    public void prePersist() {
        if (parkingCapacity == null) parkingCapacity = 0;
    }
}
