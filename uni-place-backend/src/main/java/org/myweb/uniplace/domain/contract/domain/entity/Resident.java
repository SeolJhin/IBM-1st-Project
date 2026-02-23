package org.myweb.uniplace.domain.contract.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "residents",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_resident",
                        columnNames = {"contract_id", "user_id"}
                )
        }
)
public class Resident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resident_id")
    private Integer residentId;

    @Column(name = "building_id", nullable = false)
    private Integer buildingId;

    @Column(name = "contract_id", nullable = false)
    private Integer contractId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;
}