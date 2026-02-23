package org.myweb.uniplace.domain.support.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.domain.support.domain.enums.NoticeStatus;
import org.myweb.uniplace.global.common.BaseTimeEntity;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notice")
public class Notice extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Integer noticeId;

    @Column(name = "notice_title", nullable = false, length = 100)
    private String noticeTitle;

    /** FK -> users(user_id) */
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "notice_ctnt", length = 3000)
    private String noticeCtnt;

    /** 중요도 Y/N */
    @Column(name = "importance", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String importance;

    /** 중요도 게시 종료날짜 */
    @Column(name = "imp_end_at")
    private LocalDateTime impEndAt;

    @Column(name = "read_count", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer readCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "notice_st", nullable = false,
            columnDefinition = "ENUM('notice','event','FAQ','policy','partnership','recruit','operation') DEFAULT 'notice'")
    private NoticeStatus noticeSt;

    @Column(name = "file_ck", columnDefinition = "CHAR(1) DEFAULT 'N'")
    private String fileCk;

    /** FK -> common_code(code) */
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @PrePersist
    public void prePersist() {
        if (noticeSt == null) noticeSt = NoticeStatus.notice;
        if (readCount == null) readCount = 0;
        if (importance == null) importance = "N";
        if (fileCk == null) fileCk = "N";
    }

    public void update(String noticeTitle, String noticeCtnt, String importance,
                       LocalDateTime impEndAt, NoticeStatus noticeSt, String code) {
        if (noticeTitle != null) this.noticeTitle = noticeTitle;
        if (noticeCtnt != null) this.noticeCtnt = noticeCtnt;
        if (importance != null) this.importance = importance;
        if (impEndAt != null) this.impEndAt = impEndAt;
        if (noticeSt != null) this.noticeSt = noticeSt;
        if (code != null) this.code = code;
    }

    public void increaseReadCount() {
        this.readCount = (this.readCount == null ? 0 : this.readCount) + 1;
    }
}

