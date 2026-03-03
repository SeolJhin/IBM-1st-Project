package org.myweb.uniplace.domain.community.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.user.domain.entity.User;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {

    private Integer boardId;
    private String boardTitle;

    private String userId;            // 익명이면 "익명(글쓴이)", 아니면 닉네임
    private String realUserId;        // 항상 실제 userId (본인 여부 판단용)
    private String realUserNickname;  // 항상 실제 닉네임 (어드민 표시용)

    private String boardCtnt;

    private Integer readCount;
    private String code;

    private String anonymity;
    private String importance;
    private LocalDateTime impEndAt;

    private String fileCk;
    private String replyCk;

    private long likeCount;
    private boolean likedByMe;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<FileResponse> files;

    public static BoardResponse fromEntity(Board e, List<FileResponse> files, long likeCount, boolean likedByMe, User author) {
        String realNickname = (author != null && author.getUserNickname() != null && !author.getUserNickname().isBlank())
                ? author.getUserNickname()
                : e.getUserId();

        String displayName;
        if (e.isAnonymous()) {
            displayName = "익명(글쓴이)";
        } else {
            displayName = realNickname;
        }

        return BoardResponse.builder()
                .boardId(e.getBoardId())
                .boardTitle(e.getBoardTitle())
                .userId(displayName)
                .realUserId(e.getUserId())
                .realUserNickname(realNickname)   // 어드민용: 항상 실제 닉네임
                .boardCtnt(e.getBoardCtnt())
                .readCount(e.getReadCount())
                .code(e.getCode())
                .anonymity(e.getAnonymity())
                .importance(e.getImportance())
                .impEndAt(e.getImpEndAt())
                .fileCk(e.getFileCk())
                .replyCk(e.getReplyCk())
                .likeCount(likeCount)
                .likedByMe(likedByMe)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .files(files)
                .build();
    }

    // 하위 호환 - User 없이 호출 시 (기존 userId 그대로 표시)
    public static BoardResponse fromEntity(Board e, List<FileResponse> files, long likeCount, boolean likedByMe) {
        return fromEntity(e, files, likeCount, likedByMe, null);
    }

    public static BoardResponse fromEntity(Board e, long likeCount, boolean likedByMe) {
        return fromEntity(e, null, likeCount, likedByMe, null);
    }

    // 파일 없이 + User 포함
    public static BoardResponse fromEntity(Board e, long likeCount, boolean likedByMe, User author) {
        return fromEntity(e, null, likeCount, likedByMe, author);
    }
}
