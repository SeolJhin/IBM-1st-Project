package org.myweb.uniplace.domain.support.domain.entity;

import jakarta.persistence.*;
import lombok.*;
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
}
