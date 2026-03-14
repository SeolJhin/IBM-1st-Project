package org.myweb.uniplace.domain.inspection.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionSpaceType;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

import java.math.BigDecimal;

/**
 * 점검 기록 엔티티 (inspection 테이블)
 *
 * 관리자가 공간을 점검할 때마다 1개의 레코드가 생성됩니다.
 * before_file_id: 이전 점검 이미지 (첫 점검이면 NULL)
 * after_file_id : 이번 점검 이미지
 * diff_file_id  : AI가 생성한 차이 이미지 (OpenCV 결과)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inspection")
public class Inspection extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_id")
    private Integer inspectionId;

    /** 점검 대상 공간 종류: ROOM / BUILDING / COMMON_SPACE */
    @Enumerated(EnumType.STRING)
    @Column(name = "space_type", nullable = false)
    private InspectionSpaceType spaceType;

    /** 공간 PK (room_id / building_id / space_id) */
    @Column(name = "space_id", nullable = false)
    private Integer spaceId;

    /** 점검한 관리자의 user_id */
    @Column(name = "inspector_id", nullable = false, length = 50)
    private String inspectorId;

    /** 이전 점검 이미지 file_id (첫 점검이면 NULL) */
    @Column(name = "before_file_id")
    private Integer beforeFileId;

    /** 이번 점검 이미지 file_id */
    @Column(name = "after_file_id", nullable = false)
    private Integer afterFileId;

    /** AI가 생성한 차이 이미지 file_id */
    @Column(name = "diff_file_id")
    private Integer diffFileId;

    /** AI가 계산한 변화율 (0.00 ~ 100.00 %) */
    @Column(name = "change_percent", precision = 5, scale = 2)
    private BigDecimal changePercent;

    /** 점검 결과 상태 */
    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_st", nullable = false)
    @Builder.Default
    private InspectionStatus inspectionStatus = InspectionStatus.completed;

    /** 점검 메모 (관리자 직접 입력) */
    @Column(name = "inspection_memo", length = 1000)
    private String inspectionMemo;
}
