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
@Table(name = "common_code",
       indexes = {
               @Index(name = "ix_common_code_group", columnList = "group_code")
       }
)
public class CommonCode {

    /**
     * ✅ 최신 스크립트 기준: PRIMARY KEY (code)
     * => 코드(code)는 전체 테이블에서 유니크
     */
    @Id
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_code", nullable = false,
            foreignKey = @ForeignKey(name = "fk_common_code_group"))
    private GroupCommonCode group;

    @Column(name = "code_value", nullable = false, length = 100)
    private String codeValue;

    @Column(name = "description", length = 100)
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder;

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

    public String getGroupCode() {
        return group == null ? null : group.getGroupCode();
    }
}