package org.myweb.uniplace.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

// is_active 쓰는 테이블 일 떄 참조하는 엔티티

/**
 * ActivateEntity
 *
 * - 활성화/비활성화(Active)용 공통 엔티티
 * - 상속받는 엔티티에 is_active 필드 제공
 *   - 1 : 활성 상태 (Active)
 *   - 0 : 비활성 상태 (Inactive)
 * - deactivate() 호출 → is_active = 0
 * - isActive() 호출 → 활성 여부 확인 가능
 *
 * 사용법:
 * 1. 엔티티 클래스에서 상속받아 사용
 *    @Entity
 *    public class User extends ActivateEntity { ... }
 *
 * 2. 특정 엔티티에서 활성 데이터만 조회하고 싶으면
 *    JPA Query에서 조건 추가
 *    예: WHERE is_active = 1
 */

@Getter
@MappedSuperclass
public abstract class ActivateEntity extends BaseTimeEntity {

    @Column(name = "is_active", nullable = false)
    protected Integer isActive = 1;

    public void deactivate() {
        this.isActive = 0;
    }
}