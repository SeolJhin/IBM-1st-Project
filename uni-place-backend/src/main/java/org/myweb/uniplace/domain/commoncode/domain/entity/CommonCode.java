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
        name = "common_code",
        indexes = {
                @Index(name = "ix_common_code_group", columnList = "group_code")
        }
)
public class CommonCode extends BaseTimeEntity {

    /**
     * ✅ 최신 스크립트 기준: PRIMARY KEY (code)
     */
    @Id
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "group_code",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_common_code_group")
    )
    private GroupCommonCode group;

    @Column(name = "code_value", nullable = false, length = 100)
    private String codeValue;

    @Column(name = "description", length = 100)
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder;

    /**
     * DB: INT NOT NULL DEFAULT 1 (1=활성, 0=비활성)
     */
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

    public String getGroupCode() {
        return group == null ? null : group.getGroupCode();
    }
}