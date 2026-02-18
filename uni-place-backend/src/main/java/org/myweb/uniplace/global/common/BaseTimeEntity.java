package org.myweb.uniplace.global.common;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.sql.Date; // SQL DATE 타입 임포트

/**
 * BaseTimeEntity
 *
 * - 모든 엔티티에서 공통으로 사용하는 생성일/수정일 관리용 추상 클래스
 * - JPA Auditing 기능을 통해 자동으로 값이 채워짐
 * - LocalDateTime: 시각까지 기록이 필요할 때 사용
 * - java.sql.Date: 날짜만 기록이 필요할 때 사용
 *
 * 사용법:
 * 1. 직접 상속하지 않고, SoftDeleteEntity 또는 ActivateEntity를 상속하여 사용하는 것을 권장
 *    - SoftDeleteEntity : delete_yn 기반 논리 삭제용 엔티티
 *    - ActivateEntity   : is_active 기반 활성/비활성 관리용 엔티티
 *
 * 2. 직접 상속 가능하지만, SoftDeleteEntity나 ActivateEntity를 상속하면
 *    생성/수정 시간 정보가 자동 포함되어 프로젝트 전반에서 일관성 유지 가능
 *
 * 3. 날짜 필드(createdDate, updatedDate)는 LocalDateTime과 달리 시각 정보는 버리고 날짜만 기록됨
 *
 * 예시:
 * @Entity
 * public class Building extends SoftDeleteEntity { ... }
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    /** 생성 시각(시, 분, 초 포함) */
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    protected LocalDateTime createdAt;

    /** 수정 시각(시, 분, 초 포함) */
    @LastModifiedDate
    @Column(name = "updated_at")
    protected LocalDateTime updatedAt;

    /** 생성 날짜만 기록 (시간 정보는 없음) */
    @Column(name = "created_date", updatable = false)
    protected Date createdDate;

    /** 수정 날짜만 기록 (시간 정보는 없음) */
    @Column(name = "updated_date")
    protected Date updatedDate;
}
