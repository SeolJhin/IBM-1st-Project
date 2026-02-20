package org.myweb.uniplace.global.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

/**
 * SoftDeleteEntity
 *
 * - 논리 삭제(Soft Delete)용 엔티티
 * - delete_yn 필드 제공 ('N': 정상, 'Y': 삭제)
 * - softDelete() 호출 → 삭제 처리
 * - isDeleted() 호출 → 삭제 여부 확인 가능
 * - BaseTimeEntity 상속 → 생성/수정 시각 자동 관리
 */
@Getter
@MappedSuperclass
public abstract class SoftDeleteEntity extends BaseTimeEntity {

    /** 논리 삭제 여부, 기본값 'N' */
	@Column(name = "delete_yn", nullable = false, columnDefinition = "CHAR(1)")
	protected String deleteYn = "N";

    /** 삭제 처리 메소드 */
    public void softDelete() {
        this.deleteYn = "Y";
    }

    /** 삭제 여부 확인 메소드 */
    public boolean isDeleted() {
        return "Y".equals(this.deleteYn);
    }
}
