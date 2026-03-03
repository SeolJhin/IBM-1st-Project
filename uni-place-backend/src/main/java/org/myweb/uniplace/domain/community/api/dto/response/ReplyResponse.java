package org.myweb.uniplace.domain.community.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.myweb.uniplace.domain.user.domain.entity.User;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyResponse {

    private Integer replyId;
    private Integer boardId;

    /**
     * 익명이면 실제 userId 대신 null 반환 (프론트에서 anonMap으로 번호 매핑).
     * 비익명이면 실제 userId 반환.
     */
    private String userId;

    /**
     * 항상 실제 userId (본인 여부 판단용 — 본인 댓글에만 수정/삭제 버튼 표시).
     * 프론트에서만 사용하며 화면에 노출하지 말 것.
     */
    private String realUserId;

    private String anonymity;   // "Y" or "N"

    private String replyCtnt;

    private Integer parentId;
    private Integer replyLev;
    private Integer replySeq;

    private long likeCount;
    private boolean likedByMe;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReplyResponse fromEntity(Reply e, long likeCount, boolean likedByMe, User author) {
        boolean isAnon = "Y".equalsIgnoreCase(e.getAnonymity());

        String displayName = null;
        if (!isAnon) {
            displayName = (author != null && author.getUserNickname() != null && !author.getUserNickname().isBlank())
                    ? author.getUserNickname()
                    : e.getUserId();
        }

        return ReplyResponse.builder()
                .replyId(e.getReplyId())
                .boardId(e.getBoardId())
                .userId(displayName)
                .realUserId(e.getUserId())
                .anonymity(e.getAnonymity() != null ? e.getAnonymity() : "N")
                .replyCtnt(e.getReplyCtnt())
                .parentId(e.getParentId())
                .replyLev(e.getReplyLev())
                .replySeq(e.getReplySeq())
                .likeCount(likeCount)
                .likedByMe(likedByMe)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    // 하위 호환
    public static ReplyResponse fromEntity(Reply e, long likeCount, boolean likedByMe) {
        return fromEntity(e, likeCount, likedByMe, null);
    }
}
