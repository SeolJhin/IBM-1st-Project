// Entity (Room) - FK 적용 + UNIQUE 적용
// 경로: org/myweb/uniplace/domain/property/domain/entity/Room.java
package org.myweb.uniplace.domain.property.domain.entity;

import java.math.BigDecimal;

import org.myweb.uniplace.domain.property.domain.enums.RentType;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.myweb.uniplace.domain.property.domain.enums.SunDirection;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "rooms",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_rooms_building_roomno",
                        columnNames = { "building_id", "room_no" }
                )
        }
)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id", nullable = false)
    private Integer roomId;

    @Column(name = "room_no", nullable = false)
    private Integer roomNo;

    @Column(name = "floor", nullable = false)
    private Integer floor;

    @Column(name = "room_size", nullable = false, precision = 5, scale = 2)
    private BigDecimal roomSize;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(name = "deposit", precision = 12, scale = 0)
    private BigDecimal deposit;

    @Column(name = "rent_price", nullable = false, precision = 12, scale = 0)
    private BigDecimal rentPrice;

    @Column(name = "manage_fee", precision = 12, scale = 0)
    private BigDecimal manageFee;

    @Enumerated(EnumType.STRING)
    @Column(name = "rent_type", nullable = false, length = 20)
    private RentType rentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_st", nullable = false, length = 20)
    private RoomStatus roomSt;

    @Column(name = "room_options", length = 500)
    private String roomOptions;

    @Column(name = "room_capacity")
    private Integer roomCapacity;

    @Column(name = "rent_min")
    private Integer rentMin;

    @Enumerated(EnumType.STRING)
    @Column(name = "sun_direction", length = 5)
    private SunDirection sunDirection;

    @Column(name = "room_desc", length = 3000)
    private String roomDesc;

    @PrePersist
    public void prePersist() {
        if (rentType == null) rentType = RentType.monthly_rent;
        if (roomSt == null) roomSt = RoomStatus.available;
        if (roomCapacity == null) roomCapacity = 1;
    }
}