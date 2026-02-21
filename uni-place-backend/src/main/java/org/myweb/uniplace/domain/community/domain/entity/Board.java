package org.myweb.uniplace.domain.community.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "board")
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_id", nullable = false)
    private Integer boardId;

    @Column(name = "board_title", nullable = false, length = 300)
    private String boardTitle;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "board_ctnt", length = 3000)
    private String boardCtnt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "read_count", nullable = false)
    private Integer readCount;

    // FK: common_code(code)
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    // 'Y'/'N'
    @Column(name = "anonymity", nullable = false, length = 1)
    private String anonymity;

    @Column(name = "importance", nullable = false, length = 1)
    private String importance;

    @Column(name = "imp_end_at")
    private LocalDateTime impEndAt;

    @Column(name = "file_ck", nullable = false, length = 1)
    private String fileCk;

    @Column(name = "reply_ck", nullable = false, length = 1)
    private String replyCk;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (readCount == null) readCount = 0;

        if (anonymity == null) anonymity = "N";
        if (importance == null) importance = "N";
        if (fileCk == null) fileCk = "N";
        if (replyCk == null) replyCk = "N";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void markFile(boolean hasFile) {
        this.fileCk = hasFile ? "Y" : "N";
    }

    public void markReply(boolean hasReply) {
        this.replyCk = hasReply ? "Y" : "N";
    }

    public boolean isAnonymous() { return "Y".equalsIgnoreCase(anonymity); }
    public boolean isImportant() { return "Y".equalsIgnoreCase(importance); }
}