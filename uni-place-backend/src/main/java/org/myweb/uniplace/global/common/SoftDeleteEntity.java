package org.myweb.uniplace.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.Where;

//delete_yn 쓰는 테이블 일 떄 참조하는 엔티티

/**
 * SoftDeleteEntity
 *
 * - 논리 삭제(Soft Delete)용 공통 엔티티
 * - 상속받는 엔티티에 delete_yn 필드 제공
 *   - 'N' : 정상 데이터
 *   - 'Y' : 삭제된 데이터
 * - softDelete() 호출 → delete_yn = 'Y'
 * - isDeleted() 호출 → 삭제 여부 확인 가능
 *
 * 사용법:
 * 1. 엔티티 클래스에서 상속받아 사용
 *    @Entity
 *    public class Building extends SoftDeleteEntity { ... }
 * 
 * 2. 특정 엔티티에서 자동으로 삭제되지 않은 데이터만 조회하려면
 *    Hibernate @Where 적용
 *    @Where(clause = "delete_yn = 'N'")
 */

@Getter
@MappedSuperclass
public abstract class SoftDeleteEntity extends BaseTimeEntity {

    @Column(name = "delete_yn", nullable = false, length = 1)
    protected String deleteYn = "N";

    public void softDelete() {
        this.deleteYn = "Y";
    }

    public boolean isDeleted() {
        return "Y".equals(this.deleteYn);
    }
}

