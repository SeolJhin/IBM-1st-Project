// Entity
// 경로: org/myweb/uniplace/domain/property/domain/entity/CommonSpace.java
package org.myweb.uniplace.domain.property.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "common_space")
public class CommonSpace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "space_id", nullable = false)
    private Integer spaceId;

    @Column(name = "space_nm", nullable = false, length = 50)
    private String spaceNm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(name = "space_capacity")
    private Integer spaceCapacity;

    @Column(name = "space_floor", nullable = false)
    private Integer spaceFloor;

    @Column(name = "space_options", length = 500)
    private String spaceOptions;

    @Column(name = "space_desc", length = 3000)
    private String spaceDesc;
}