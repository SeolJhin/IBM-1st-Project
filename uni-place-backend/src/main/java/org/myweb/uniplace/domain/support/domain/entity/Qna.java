package org.myweb.uniplace.domain.support.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "qna")
public class Qna extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "qna_id")
    private Integer qnaId;

    /** 답변일 때 질문게시글 ID (자기참조 FK, on delete cascade) */
    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "qna_title", nullable = false, length = 255)
    private String qnaTitle;

    /** FK -> users(user_id) */
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "qna_st", columnDefinition = "ENUM('waiting','complete') DEFAULT 'waiting'")
    private QnaStatus qnaSt;

    @Column(name = "read_count", columnDefinition = "INT DEFAULT 0")
    private Integer readCount;

    @Column(name = "qna_ctnt", nullable = false, length = 4000)
    private String qnaCtnt;

    /** FK -> common_code(code) */
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "file_ck", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String fileCk;

    @Column(name = "reply_ck", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String replyCk;

    /** 질문-답변 묶음 아이디 */
    @Column(name = "group_id")
    private Integer groupId;

    /** 계층 깊이 (0: 질문, 1: 답변) */
    @Column(name = "qna_lev", columnDefinition = "INT DEFAULT 0")
    private Integer qnaLev;

    @PrePersist
    public void prePersist() {
        if (qnaSt == null) qnaSt = QnaStatus.waiting;
        if (readCount == null) readCount = 0;
        if (fileCk == null) fileCk = "N";
        if (replyCk == null) replyCk = "N";
        if (qnaLev == null) qnaLev = 0;
    }

    public void update(String qnaTitle, String qnaCtnt) {
        if (qnaTitle != null) this.qnaTitle = qnaTitle;
        if (qnaCtnt != null) this.qnaCtnt = qnaCtnt;
    }

    /** 관리자 답변 수정 전용 */
    public void updateAnswer(String qnaTitle, String qnaCtnt) {
        if (qnaTitle != null) this.qnaTitle = qnaTitle;
        if (qnaCtnt != null) this.qnaCtnt = qnaCtnt;
    }

    public void updateStatus(QnaStatus qnaSt) {
        if (qnaSt != null) this.qnaSt = qnaSt;
    }

    public void increaseReadCount() {
        this.readCount = (this.readCount == null ? 0 : this.readCount) + 1;
    }
}

