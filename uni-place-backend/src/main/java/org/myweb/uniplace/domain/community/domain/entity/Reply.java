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
@Table(name = "reply")
public class Reply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reply_id", nullable = false)
    private Integer replyId;

    @Column(name = "board_id", nullable = false)
    private Integer boardId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "reply_ctnt", nullable = false, length = 2000)
    private String replyCtnt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "parent_id")
    private Integer parentId;

    @Column(name = "reply_lev", nullable = false)
    private Integer replyLev;

    @Column(name = "reply_seq", nullable = false)
    private Integer replySeq;

    @Column(name = "anonymity", nullable = false, length = 1)
    private String anonymity;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (replyLev == null) replyLev = 1;
        if (replySeq == null) replySeq = 1;
        if (anonymity == null) anonymity = "N";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
