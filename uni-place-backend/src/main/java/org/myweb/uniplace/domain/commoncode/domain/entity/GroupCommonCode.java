package org.myweb.uniplace.domain.commoncode.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "group_common_code",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_group_code_name", columnNames = "group_code_name")
        }
)
public class GroupCommonCode {

    @Id
    @Column(name = "group_code", nullable = false, length = 20)
    private String groupCode;

    @Column(name = "group_code_name", nullable = false, length = 100)
    private String groupCodeName;

    @Column(name = "description", length = 100)
    private String description;

    /**
     * DB: INT NOT NULL DEFAULT 1
     * - 1: 활성, 0: 비활성
     */
    @Column(name = "is_active", nullable = false)
    private Integer isActive;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (isActive == null) isActive = 1;
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public void changeActive(boolean active) {
        this.isActive = active ? 1 : 0;
    }
}