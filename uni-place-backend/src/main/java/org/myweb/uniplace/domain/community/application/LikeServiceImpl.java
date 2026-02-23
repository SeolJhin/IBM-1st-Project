// 경로: org/myweb/uniplace/domain/community/application/LikeServiceImpl.java
package org.myweb.uniplace.domain.community.application;

import org.myweb.uniplace.domain.community.domain.entity.*;
import org.myweb.uniplace.domain.community.repository.*;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeServiceImpl implements LikeService {

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;

    private final BoardLikeRepository boardLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;

    // 알림
    private final NotificationService notificationService;

    @Override
    public void likeBoard(int boardId, String userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        BoardLike.Id id = new BoardLike.Id(userId, boardId);
        if (boardLikeRepository.existsById(id)) return;

        boardLikeRepository.save(BoardLike.builder().id(id).build());

        // 알림: 내 글에 내가 좋아요 누른 건 스킵
        if (!userId.equals(board.getUserId())) {
            String msg = "작성하신 게시글에 좋아요가 눌렸습니다.";
            notificationService.notifyUser(
                    board.getUserId(),
                    NotificationType.BRD_LIKE,
                    msg,
                    userId,
                    TargetType.board,
                    boardId,
                    "/boards/" + boardId
            );
        }
    }

    @Override
    public void unlikeBoard(int boardId, String userId) {
        BoardLike.Id id = new BoardLike.Id(userId, boardId);
        if (!boardLikeRepository.existsById(id)) return;

        boardLikeRepository.deleteById(id);
        // 취소 알림은 보통 안 보냄
    }

    @Override
    public void likeReply(int replyId, String userId) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        ReplyLike.Id id = new ReplyLike.Id(userId, replyId);
        if (replyLikeRepository.existsById(id)) return;

        replyLikeRepository.save(ReplyLike.builder().id(id).build());

        //알림: 내 댓글에 내가 좋아요 누른 건 스킵
        if (!userId.equals(reply.getUserId())) {
            String msg = "작성하신 댓글에 좋아요가 눌렸습니다.";
            notificationService.notifyUser(
                    reply.getUserId(),
                    NotificationType.RPL_LIKE,
                    msg,
                    userId,
                    TargetType.reply,
                    replyId,
                    "/boards/" + reply.getBoardId()
            );
        }
    }

    @Override
    public void unlikeReply(int replyId, String userId) {
        ReplyLike.Id id = new ReplyLike.Id(userId, replyId);
        if (!replyLikeRepository.existsById(id)) return;

        replyLikeRepository.deleteById(id);
        //취소 알림은 보통 안 보냄
    }
}