package org.myweb.uniplace.domain.support.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "complain")
public class Complain extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comp_id")
    private Integer compId;

    @Column(name = "comp_title", nullable = false, length = 300)
    private String compTitle;

    /** FK -> users(user_id) on delete cascade */
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "comp_ctnt", length = 3000)
    private String compCtnt;

    @Enumerated(EnumType.STRING)
    @Column(name = "comp_st", nullable = false,
            columnDefinition = "ENUM('received','in_progress','resolved') DEFAULT 'received'")
    private ComplainStatus compSt;

    /**
     * AI가 분류한 민원 중요도
     * high   : 긴급 (화재/누수/폭력 등) → 관리자 즉시 알림
     * medium : 일반 수리/불편 민원
     * low    : 단순 문의/건의
     * null   : AI 분류 전 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "importance",
            columnDefinition = "ENUM('high','medium','low') NULL COMMENT 'AI 분류 중요도'")
    private ComplainImportance importance;

    /**
     * AI가 중요도를 판단한 근거 (관리자 참고용)
     * 예: "천장 누수 + 감전 위험 키워드 감지 → 즉각 대응 필요"
     */
    @Column(name = "ai_reason", length = 500,
            columnDefinition = "VARCHAR(500) NULL COMMENT 'AI 분류 근거'")
    private String aiReason;

    /** FK -> common_code(code) */
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "file_ck", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String fileCk;

    @Column(name = "reply_ck", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String replyCk;

    @PrePersist
    public void prePersist() {
        if (compSt == null) compSt = ComplainStatus.received;
        if (fileCk == null) fileCk = "N";
        if (replyCk == null) replyCk = "N";
    }

    public void updateStatus(ComplainStatus compSt) {
        if (compSt != null) this.compSt = compSt;
    }

    /** 사용자 민원 내용 수정 */
    public void update(String compTitle, String compCtnt) {
        if (compTitle != null) this.compTitle = compTitle;
        if (compCtnt != null) this.compCtnt = compCtnt;
    }

    /** 관리자 답변 처리: reply_ck = 'Y', 상태 변경 */
    public void markReplied(ComplainStatus compSt) {
        this.replyCk = "Y";
        if (compSt != null) this.compSt = compSt;
        else this.compSt = ComplainStatus.resolved;
    }

    /** AI 분류 결과 저장 - 민원 등록 후 비동기로 호출됨 */
    public void applyAiClassification(ComplainImportance importance, String aiReason) {
        this.importance = importance;
        this.aiReason = aiReason;
    }
}
