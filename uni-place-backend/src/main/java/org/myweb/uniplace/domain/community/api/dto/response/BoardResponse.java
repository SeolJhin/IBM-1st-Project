package org.myweb.uniplace.domain.community.api.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardResponse {

    private Integer boardId;
    private String boardTitle;

    // ✅ 익명글이면 "익명"
    private String userId;

    private String boardCtnt;

    private Integer readCount;
    private String code;

    private String anonymity;
    private String importance;
    private LocalDateTime impEndAt;

    private String fileCk;
    private String replyCk;

    // ✅ 좋아요 합계
    private long likeCount;

    // ✅ 내가 좋아요 눌렀는지
    private boolean likedByMe;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<FileResponse> files;

    public static BoardResponse fromEntity(Board e, List<FileResponse> files, long likeCount, boolean likedByMe) {
        String writer = e.isAnonymous() ? "익명" : e.getUserId();

        return BoardResponse.builder()
                .boardId(e.getBoardId())
                .boardTitle(e.getBoardTitle())
                .userId(writer)
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

    public static BoardResponse fromEntity(Board e, long likeCount, boolean likedByMe) {
        return fromEntity(e, null, likeCount, likedByMe);
    }
}