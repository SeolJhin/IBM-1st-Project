// 경로: org/myweb/uniplace/domain/community/application/AdminBoardServiceImpl.java
package org.myweb.uniplace.domain.community.application;

import java.util.List;

import org.myweb.uniplace.domain.community.api.admin.dto.request.BoardImportanceUpdateRequest;
import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.myweb.uniplace.domain.community.repository.BoardLikeRepository;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.community.repository.ReplyLikeRepository;
import org.myweb.uniplace.domain.community.repository.ReplyRepository;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminBoardServiceImpl implements AdminBoardService {

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final FileService fileService;

    @Override
    public void deleteBoardAsAdmin(int boardId) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        // 1) 파일 soft delete (BOARD, boardId)
        List<FileResponse> files = fileService.getActiveFiles("BOARD", boardId);
        if (files != null && !files.isEmpty()) {
            List<Integer> fileIds = files.stream().map(FileResponse::getFileId).toList();
            fileService.softDeleteFilesByParent("BOARD", boardId, fileIds);
        }

        // 2) 해당 게시글의 댓글 ID들 조회
        List<Integer> replyIds = replyRepository.findReplyIdsByBoardId(boardId);

        // 3) 댓글 좋아요 삭제
        if (replyIds != null && !replyIds.isEmpty()) {
            replyLikeRepository.deleteByReplyIds(replyIds);
        }

        // 4) 댓글 삭제
        replyRepository.deleteByBoardId(boardId);

        // 5) 게시글 좋아요 삭제
        boardLikeRepository.deleteByBoardId(boardId);

        // 6) 게시글 삭제
        boardRepository.delete(board);
    }

    @Override
    public void deleteReplyAsAdmin(int replyId) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        int boardId = reply.getBoardId();

        // 댓글 좋아요 먼저 삭제
        replyLikeRepository.deleteById(new org.myweb.uniplace.domain.community.domain.entity.ReplyLike.Id(reply.getUserId(), replyId));
        // ↑ 위 한 줄은 "해당 댓글 좋아요 전체" 삭제가 아니야.
        // 그래서 아래 deleteByReplyIds(리플ID 단위)로 삭제하는 쪽이 더 안전함:
        replyLikeRepository.deleteByReplyIds(List.of(replyId));

        // 댓글 삭제
        replyRepository.delete(reply);

        // replyCk 재계산
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));
        board.markReply(replyRepository.countByBoardId(boardId) > 0);
    }

    @Override
    public void updateImportance(int boardId, BoardImportanceUpdateRequest request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        String imp = normalizeYn(request != null ? request.getImportance() : null, "N");
        board.setImportance(imp);
        board.setImpEndAt(request != null ? request.getImpEndAt() : null);
    }

    private String normalizeYn(String v, String def) {
        if (v == null || v.isBlank()) return def;
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }
}