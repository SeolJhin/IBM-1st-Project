package org.myweb.uniplace.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * BaseTimeEntity
 *
 * - 모든 엔티티에서 공통으로 사용하는 생성/수정 시각 관리용 추상 클래스
 * - LocalDateTime 하나만 사용하여 날짜 + 시간 모두 관리
 * - 날짜만 필요할 경우 getCreatedDateOnly(), getUpdatedDateOnly() 사용
 * - Auditing 적용 가능 (@CreatedDate / @LastModifiedDate)
 * 
 * 예시
 * - File	단순 생성/수정 시각만 필요 → BaseTimeEntity
 * - Building	논리 삭제 + 생성/수정 시각 필요 → SoftDeleteEntity
 * - Notice	활성/비활성 + 생성/수정 시각 필요 → ActivateEntity
 */
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

