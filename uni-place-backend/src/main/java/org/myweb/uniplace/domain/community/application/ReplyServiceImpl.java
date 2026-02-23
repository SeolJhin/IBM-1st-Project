// 경로: org/myweb/uniplace/domain/community/application/ReplyServiceImpl.java
package org.myweb.uniplace.domain.community.application;

import java.util.*;

import org.myweb.uniplace.domain.community.api.dto.request.ReplyCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.ReplyUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.ReplyResponse;
import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.community.repository.ReplyLikeRepository;
import org.myweb.uniplace.domain.community.repository.ReplyRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReplyServiceImpl implements ReplyService {

    private final ReplyRepository replyRepository;
    private final BoardRepository boardRepository;
    private final ReplyLikeRepository replyLikeRepository;

    // ✅ 알림
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<ReplyResponse> getRepliesByBoard(int boardId) {
        List<Reply> replies = replyRepository.findByBoardIdAndParentIdIsNullOrderByCreatedAtAscReplySeqAsc(boardId);
        Map<Integer, Long> likeCountMap = loadReplyLikeCounts(replies);

        String me = tryCurrentUserId();

        return replies.stream()
                .map(r -> {
                    long cnt = likeCountMap.getOrDefault(r.getReplyId(), 0L);
                    boolean liked = (me != null) && replyLikeRepository.existsByIdUserIdAndIdReplyId(me, r.getReplyId());
                    return ReplyResponse.fromEntity(r, cnt, liked);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReplyResponse> getChildReplies(int boardId, int parentId) {
        List<Reply> replies = replyRepository.findByBoardIdAndParentIdOrderByCreatedAtAscReplySeqAsc(boardId, parentId);
        Map<Integer, Long> likeCountMap = loadReplyLikeCounts(replies);

        String me = tryCurrentUserId();

        return replies.stream()
                .map(r -> {
                    long cnt = likeCountMap.getOrDefault(r.getReplyId(), 0L);
                    boolean liked = (me != null) && replyLikeRepository.existsByIdUserIdAndIdReplyId(me, r.getReplyId());
                    return ReplyResponse.fromEntity(r, cnt, liked);
                })
                .toList();
    }

    @Override
    public void createReply(int boardId, ReplyCreateRequest request) {
        String userId = requireCurrentUserId();

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        Reply reply = Reply.builder()
                .boardId(boardId)
                .userId(userId)
                .replyCtnt(request.getReplyCtnt())
                .parentId(null)
                .replyLev(1)
                .replySeq(1)
                .build();

        Reply saved = replyRepository.save(reply);
        board.markReply(true);

        // ✅ 알림: "내 글에 댓글"
        if (!userId.equals(board.getUserId())) {
            String msg = "내 게시글에 댓글이 달렸습니다.";
            notificationService.notifyUser(
                    board.getUserId(),
                    NotificationType.BRD_REPLY,
                    msg,
                    userId,
                    TargetType.reply,
                    saved.getReplyId(),
                    "/boards/" + boardId
            );
        }
    }

    @Override
    public void createChildReply(int boardId, int parentId, ReplyCreateRequest request) {
        String userId = requireCurrentUserId();

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        Reply parent = replyRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("부모 댓글이 존재하지 않습니다. parentId=" + parentId));

        if (!Objects.equals(boardId, parent.getBoardId())) {
            throw new IllegalArgumentException("부모 댓글이 해당 게시글의 댓글이 아닙니다.");
        }

        Reply child = Reply.builder()
                .boardId(boardId)
                .userId(userId)
                .replyCtnt(request.getReplyCtnt())
                .parentId(parentId)
                .replyLev(2)
                .replySeq(1)
                .build();

        Reply saved = replyRepository.save(child);
        board.markReply(true);

        // ✅ 알림: "내 댓글에 대댓글"
        // - 내 댓글에 내가 대댓글 다는건 스킵
        if (!userId.equals(parent.getUserId())) {
            String msg = "내 댓글에 대댓글이 달렸습니다.";
            notificationService.notifyUser(
                    parent.getUserId(),
                    NotificationType.BRD_REREPLY,
                    msg,
                    userId,
                    TargetType.reply,
                    saved.getReplyId(),
                    "/boards/" + boardId
            );
        }
    }

    @Override
    public void updateReply(int replyId, ReplyUpdateRequest request) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        String me = requireCurrentUserId();
        if (!me.equals(reply.getUserId())) throw new BusinessException(ErrorCode.FORBIDDEN);

        if (request.getReplyCtnt() != null) reply.setReplyCtnt(request.getReplyCtnt());
    }

    @Override
    public void deleteReply(int replyId) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        String me = requireCurrentUserId();
        if (!me.equals(reply.getUserId())) throw new BusinessException(ErrorCode.FORBIDDEN);

        Integer boardId = reply.getBoardId();
        replyRepository.deleteById(replyId);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        board.markReply(replyRepository.countByBoardId(boardId) > 0);

        // ✅ 사용자 자가삭제는 알림 보통 안 함
    }

    // ========= helpers =========

    private Map<Integer, Long> loadReplyLikeCounts(List<Reply> replies) {
        if (replies == null || replies.isEmpty()) return Map.of();

        List<Integer> ids = replies.stream().map(Reply::getReplyId).toList();
        List<Object[]> rows = replyLikeRepository.countGroupByReplyIds(ids);

        Map<Integer, Long> map = new HashMap<>();
        for (Object[] r : rows) {
            Integer id = (Integer) r[0];
            Long cnt = (Long) r[1];
            map.put(id, cnt == null ? 0L : cnt);
        }
        return map;
    }

    private String tryCurrentUserId() {
        try { return requireCurrentUserId(); }
        catch (Exception e) { return null; }
    }

    private String requireCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Object p = auth.getPrincipal();
        if (p instanceof AuthUser au) return au.getUserId();
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
}
