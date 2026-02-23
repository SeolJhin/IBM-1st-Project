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
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;

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

    // ✅ 알림
    private final NotificationService notificationService;

    @Override
    public void deleteBoardAsAdmin(int boardId) {

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        String writerId = board.getUserId();

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

        // ✅ 알림: 작성자에게 "관리자 삭제"
        notificationService.notifyUser(
                writerId,
                NotificationType.ADM_BRD_DEL,
                "관리자 정책에 의해 게시글이 삭제되었습니다.",
                null,
                TargetType.board,
                boardId,
                "/boards"
        );

        // ✅ 관리자들에게도 로그성 알림(선택)
        notificationService.notifyAdmins(
                NotificationType.ADM_BRD_DEL,
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
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        int boardId = reply.getBoardId();
        String writerId = reply.getUserId();

        // ✅ 댓글 좋아요 전체 삭제(ReplyId 단위)
        replyLikeRepository.deleteByReplyIds(List.of(replyId));

        // ✅ 댓글 삭제
        replyRepository.delete(reply);

        // ✅ replyCk 재계산
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));
        board.markReply(replyRepository.countByBoardId(boardId) > 0);

        // ✅ 알림: 댓글 작성자에게
        notificationService.notifyUser(
                writerId,
                NotificationType.ADM_RPL_DEL,
                "관리자 정책에 의해 댓글이 삭제되었습니다.",
                null,
                TargetType.reply,
                replyId,
                "/boards/" + boardId
        );

        // ✅ 관리자들에게도 로그성 알림(선택)
        notificationService.notifyAdmins(
                NotificationType.ADM_RPL_DEL,
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
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        String imp = normalizeYn(request != null ? request.getImportance() : null, "N");
        board.setImportance(imp);
        board.setImpEndAt(request != null ? request.getImpEndAt() : null);

        // ✅ 알림: 작성자에게 중요공지 지정/해제 알림
        String msg = "Y".equalsIgnoreCase(imp)
                ? "관리자가 게시글을 중요공지로 설정했습니다."
                : "관리자가 중요공지 설정을 해제했습니다.";

        notificationService.notifyUser(
                board.getUserId(),
                NotificationType.ADM_BRD_IMP,
                msg,
                null,
                TargetType.board,
                boardId,
                "/boards/" + boardId
        );

        // ✅ 관리자들에게도 로그성 알림(선택)
        notificationService.notifyAdmins(
                NotificationType.ADM_BRD_IMP,
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