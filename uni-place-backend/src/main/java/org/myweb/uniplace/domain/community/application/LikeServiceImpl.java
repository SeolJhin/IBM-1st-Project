package org.myweb.uniplace.domain.community.application;

import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.domain.entity.BoardLike;
import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.myweb.uniplace.domain.community.domain.entity.ReplyLike;
import org.myweb.uniplace.domain.community.repository.BoardLikeRepository;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.community.repository.ReplyLikeRepository;
import org.myweb.uniplace.domain.community.repository.ReplyRepository;
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
public class LikeServiceImpl implements LikeService {

    private final BoardRepository boardRepository;
    private final ReplyRepository replyRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final NotificationService notificationService;

    @Override
    public void likeBoard(int boardId, String userId) {
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        BoardLike.Id id = new BoardLike.Id(userId, boardId);
        if (boardLikeRepository.existsById(id)) return;

        boardLikeRepository.save(BoardLike.builder().id(id).build());

        if (!userId.equals(board.getUserId())) {
            notificationService.notifyUser(
                board.getUserId(),
                "BRD_LIKE",
                "작성하신 게시글에 좋아요가 눌렸습니다.",
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
    }

    @Override
    public void likeReply(int replyId, String userId) {
        Reply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REPLY_NOT_FOUND));

        ReplyLike.Id id = new ReplyLike.Id(userId, replyId);
        if (replyLikeRepository.existsById(id)) return;

        replyLikeRepository.save(ReplyLike.builder().id(id).build());

        if (!userId.equals(reply.getUserId())) {
            notificationService.notifyUser(
                reply.getUserId(),
                "RPL_LIKE",
                "작성하신 댓글에 좋아요가 눌렸습니다.",
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
    }
}
