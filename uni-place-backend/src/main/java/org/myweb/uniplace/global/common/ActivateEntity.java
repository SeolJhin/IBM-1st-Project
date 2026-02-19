package org.myweb.uniplace.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

/**
 * ActivateEntity
 *
 * - 활성/비활성 관리용 엔티티
 * - isActive 필드 제공 (1: 활성, 0: 비활성)
 * - deactivate() 호출 → 비활성 처리
 * - isActive() 호출 → 활성 여부 확인 가능
 * - BaseTimeEntity 상속 → 생성/수정 시각 자동 관리
 */
@Getter
@MappedSuperclass
public abstract class ActivateEntity extends BaseTimeEntity {

    /** 활성 상태, 기본값 1 (활성) */
    @Column(name = "is_active", nullable = false)
    protected Integer isActive = 1;

    /** 비활성화 처리 메소드 */
    public void deactivate() {
        this.isActive = 0;
    }

    /** 활성 여부 확인 메소드 */
    public boolean isActive() {
        return this.isActive != null && this.isActive == 1;
    }
}
