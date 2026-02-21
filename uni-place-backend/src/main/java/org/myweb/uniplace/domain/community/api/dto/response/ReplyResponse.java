package org.myweb.uniplace.domain.community.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.community.domain.entity.Reply;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyResponse {

    private Integer replyId;
    private Integer boardId;
    private String userId;

    private String replyCtnt;

    private Integer parentId;
    private Integer replyLev;
    private Integer replySeq;

    private long likeCount;
    private boolean likedByMe;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReplyResponse fromEntity(Reply e, long likeCount, boolean likedByMe) {
        return ReplyResponse.builder()
                .replyId(e.getReplyId())
                .boardId(e.getBoardId())
                .userId(e.getUserId())
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
}