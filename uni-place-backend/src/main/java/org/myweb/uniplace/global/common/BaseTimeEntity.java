package org.myweb.uniplace.global.common;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    /** 생성 시각 (날짜 + 시간 포함, DB 컬럼: created_at) */
    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = true)
    protected LocalDateTime createdAt;

    /** 수정 시각 (날짜 + 시간 포함, DB 컬럼: updated_at) */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = true)
    protected LocalDateTime updatedAt;

    /** 생성 날짜만 필요할 때 변환용 메소드 */
    public LocalDate getCreatedDateOnly() {
        return createdAt != null ? createdAt.toLocalDate() : null;
    }

    /** 수정 날짜만 필요할 때 변환용 메소드 */
    public LocalDate getUpdatedDateOnly() {
        return updatedAt != null ? updatedAt.toLocalDate() : null;
    }
}
