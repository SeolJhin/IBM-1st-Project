package org.myweb.uniplace.domain.commoncode.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.common.BaseTimeEntity;

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
public class GroupCommonCode extends BaseTimeEntity {

    @Id
    @Column(name = "group_code", nullable = false, length = 20)
    private String groupCode;

    @Column(name = "group_code_name", nullable = false, length = 100)
    private String groupCodeName;

    @Column(name = "description", length = 100)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Integer isActive;

    @PrePersist
    public void prePersist() {
        if (isActive == null) isActive = 1;
        // createdAt/updatedAt은 Auditing이 처리
    }

    public void changeActive(boolean active) {
        this.isActive = active ? 1 : 0;
    }
}