// Entity (인덱스만 보완)
// 경로: org/myweb/uniplace/domain/reservation/domain/entity/SpaceReservationEntity.java
package org.myweb.uniplace.domain.reservation.domain.entity;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.CommonSpace;
import org.myweb.uniplace.domain.reservation.domain.enums.SpaceReservationStatus;
import org.myweb.uniplace.domain.user.domain.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "space_reservations",
        indexes = {
                @Index(name = "ix_sr_user", columnList = "user_id"),
                @Index(name = "ix_sr_time", columnList = "sr_start_at,sr_end_at"),
                @Index(name = "ix_sr_building", columnList = "building_id"),
                @Index(name = "ix_sr_space", columnList = "space_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_space_time",
                        columnNames = { "space_id", "sr_start_at", "sr_end_at" }
                )
        }
)
public class SpaceReservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id", nullable = false)
    private Integer reservationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private CommonSpace space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "sr_start_at", nullable = false)
    private LocalDateTime srStartAt;

    @Column(name = "sr_end_at", nullable = false)
    private LocalDateTime srEndAt;

    @Column(name = "sr_no_people", nullable = false)
    private Integer srNoPeople;

    @Enumerated(EnumType.STRING)
    @Column(name = "sr_st", nullable = false, length = 20)
    private SpaceReservationStatus srSt;

    @PrePersist
    public void prePersist() {
        if (srSt == null) srSt = SpaceReservationStatus.requested;
    }
}