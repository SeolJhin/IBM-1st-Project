// Entity
// 경로: org/myweb/uniplace/domain/reservation/domain/entity/TourReservationEntity.java
package org.myweb.uniplace.domain.reservation.domain.entity;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.domain.reservation.domain.enums.TourStatus;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "room_reservation",
        indexes = {
                @Index(name = "ix_room_reservation_building", columnList = "building_id"),
                @Index(name = "ix_room_reservation_room", columnList = "room_id"),
                @Index(name = "ix_room_reservation_time", columnList = "tour_start_at,tour_end_at"),
                @Index(name = "ix_room_reservation_tel_pwd", columnList = "tour_tel,tour_pwd")
        },
        uniqueConstraints = {
                // SQL 그대로: (room_id, tour_start_at, tour_end_at)
                @UniqueConstraint(
                        name = "uq_room_reservation_room_time",
                        columnNames = { "room_id", "tour_start_at", "tour_end_at" }
                )
        }
)
public class TourReservationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tour_id", nullable = false)
    private Integer tourId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "tour_start_at", nullable = false)
    private LocalDateTime tourStartAt;

    @Column(name = "tour_end_at", nullable = false)
    private LocalDateTime tourEndAt;

    @Column(name = "tour_nm", nullable = false, length = 50)
    private String tourNm;

    @Column(name = "tour_tel", nullable = false, length = 20)
    private String tourTel;

    @Enumerated(EnumType.STRING)
    @Column(name = "tour_st", nullable = false, length = 20)
    private TourStatus tourSt;

    @Column(name = "tour_pwd", nullable = false, length = 4)
    private String tourPwd;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (tourSt == null) tourSt = TourStatus.requested;
    }
}