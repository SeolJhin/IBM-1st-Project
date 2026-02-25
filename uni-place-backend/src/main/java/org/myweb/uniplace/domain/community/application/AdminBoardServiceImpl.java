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
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
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
    private final NotificationService notificationService;

    @Override
    public void deleteBoardAsAdmin(int boardId) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        String writerId = board.getUserId();

        List<FileResponse> files = fileService.getActiveFiles("BOARD", boardId);
        if (files != null && !files.isEmpty()) {
            List<Integer> fileIds = files.stream().map(FileResponse::getFileId).toList();
            fileService.softDeleteFilesByParent("BOARD", boardId, fileIds);
        }

        List<Integer> replyIds = replyRepository.findReplyIdsByBoardId(boardId);
        if (replyIds != null && !replyIds.isEmpty()) {
            replyLikeRepository.deleteByReplyIds(replyIds);
        }

        replyRepository.deleteByBoardId(boardId);
        boardLikeRepository.deleteByBoardId(boardId);
        boardRepository.delete(board);

        notificationService.notifyUser(
            writerId,
            "ADM_BRD_DEL",
            "관리자 정책에 의해 게시글이 삭제되었습니다.",
            null,
            TargetType.board,
            boardId,
            "/boards"
        );

        notificationService.notifyAdmins(
            "ADM_BRD_DEL",
            "관리자 게시글 삭제 처리(boardId=" + boardId + ")",
            null,
            TargetType.board,
            boardId,
            "/admin"
        );
    }

    @Override
    public void deleteReplyAsAdmin(int replyId) {
        Reply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REPLY_NOT_FOUND));

        int boardId = reply.getBoardId();
        String writerId = reply.getUserId();

        replyLikeRepository.deleteByReplyIds(List.of(replyId));
        replyRepository.delete(reply);

        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
        board.markReply(replyRepository.countByBoardId(boardId) > 0);

        notificationService.notifyUser(
            writerId,
            "ADM_RPL_DEL",
            "관리자 정책에 의해 댓글이 삭제되었습니다.",
            null,
            TargetType.reply,
            replyId,
            "/boards/" + boardId
        );

        notificationService.notifyAdmins(
            "ADM_RPL_DEL",
            "관리자 댓글 삭제 처리(replyId=" + replyId + ", boardId=" + boardId + ")",
            null,
            TargetType.reply,
            replyId,
            "/admin"
        );
    }

    @Override
    public void updateImportance(int boardId, BoardImportanceUpdateRequest request) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        String imp = normalizeYn(request != null ? request.getImportance() : null, "N");
        board.setImportance(imp);
        board.setImpEndAt(request != null ? request.getImpEndAt() : null);

        String msg = "Y".equalsIgnoreCase(imp)
            ? "관리자가 게시글을 중요공지로 설정했습니다."
            : "관리자가 중요공지 설정을 해제했습니다.";

        notificationService.notifyUser(
            board.getUserId(),
            "ADM_BRD_IMP",
            msg,
            null,
            TargetType.board,
            boardId,
            "/boards/" + boardId
        );

        notificationService.notifyAdmins(
            "ADM_BRD_IMP",
            "중요공지 변경(boardId=" + boardId + ", importance=" + imp + ")",
            null,
            TargetType.board,
            boardId,
            "/admin"
        );
    }

    private String normalizeYn(String v, String def) {
        if (v == null || v.isBlank()) return def;
        return "Y".equalsIgnoreCase(v) ? "Y" : "N";
    }
}
