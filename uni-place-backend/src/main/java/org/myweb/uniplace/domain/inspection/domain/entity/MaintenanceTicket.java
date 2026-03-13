package org.myweb.uniplace.domain.inspection.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionSpaceType;
import org.myweb.uniplace.domain.inspection.domain.enums.IssueSeverity;
import org.myweb.uniplace.domain.inspection.domain.enums.TicketStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

/**
 * 유지보수 티켓 엔티티 (maintenance_ticket 테이블)
 *
 * AI가 이미지에서 문제를 감지하면 자동으로 생성됩니다.
 * 감지된 문제 1개 = 티켓 1개
 *
 * issue_type 예시:
 *   wall_crack(벽 균열), water_leak(누수), ceiling_stain(천장 얼룩),
 *   broken_light(조명 파손), structural_damage(구조 손상) 등
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "maintenance_ticket")
public class MaintenanceTicket extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Integer ticketId;

    /** 이 티켓을 생성한 점검 ID */
    @Column(name = "inspection_id", nullable = false)
    private Integer inspectionId;

    /** 점검 대상 공간 종류 */
    @Enumerated(EnumType.STRING)
    @Column(name = "space_type", nullable = false)
    private InspectionSpaceType spaceType;

    /** 공간 PK */
    @Column(name = "space_id", nullable = false)
    private Integer spaceId;

    /** 문제 유형 (AI가 분류한 값) */
    @Column(name = "issue_type", nullable = false, length = 50)
    private String issueType;

    /** 심각도: LOW / MEDIUM / HIGH / CRITICAL */
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    @Builder.Default
    private IssueSeverity severity = IssueSeverity.medium;

    /** AI가 생성한 한국어 설명 */
    @Column(name = "description", length = 1000)
    private String description;

    /** 처리 상태: OPEN / IN_PROGRESS / RESOLVED / CLOSED */
    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_st", nullable = false)
    @Builder.Default
    private TicketStatus ticketStatus = TicketStatus.open;
}
