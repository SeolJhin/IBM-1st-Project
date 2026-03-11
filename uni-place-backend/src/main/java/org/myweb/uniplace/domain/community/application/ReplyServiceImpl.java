package org.myweb.uniplace.domain.community.application;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.myweb.uniplace.domain.community.api.dto.request.ReplyCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.ReplyUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.ReplyResponse;
import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.myweb.uniplace.domain.community.repository.BoardRepository;
import org.myweb.uniplace.domain.community.repository.ReplyLikeRepository;
import org.myweb.uniplace.domain.community.repository.ReplyRepository;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.myweb.uniplace.domain.ai.application.moderation.BannedWordService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReplyServiceImpl implements ReplyService {

    private final ReplyRepository replyRepository;
    private final BoardRepository boardRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final BannedWordService bannedWordService;

    
    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReplyResponse> getMyReplies(Pageable pageable) {
        String userId = requireCurrentUserId();
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Reply> page = replyRepository.findByUserIdOrderByReplyIdDesc(userId, pageReq);

        String me = userId;
        User author = userRepository.findById(userId).orElse(null);
        Page<ReplyResponse> mapped = page.map(r -> {
            long cnt = replyLikeRepository.countByIdReplyId(r.getReplyId());
            boolean liked = replyLikeRepository.existsByIdUserIdAndIdReplyId(me, r.getReplyId());
            return ReplyResponse.fromEntity(r, cnt, liked, author);
        });
        return PageResponse.of(mapped);
    }
    
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
                User author = userRepository.findById(r.getUserId()).orElse(null);
                return ReplyResponse.fromEntity(r, cnt, liked, author);
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
                User author = userRepository.findById(r.getUserId()).orElse(null);
                return ReplyResponse.fromEntity(r, cnt, liked, author);
            })
            .toList();
    }

    @Override
    public void createReply(int boardId, ReplyCreateRequest request) {
        String userId = requireCurrentUserId();

        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        Reply reply = Reply.builder()
            .boardId(boardId)
            .userId(userId)
            .replyCtnt(bannedWordService.filter(request.getReplyCtnt()))
            .anonymity("Y".equalsIgnoreCase(request.getAnonymity()) ? "Y" : "N")
            .parentId(null)
            .replyLev(1)
            .replySeq(1)
            .build();

        Reply saved = replyRepository.save(reply);
        board.markReply(true);

        if (!userId.equals(board.getUserId())) {
            notificationService.notifyUser(
                board.getUserId(),
                "BRD_REPLY",
                "작성하신 게시글에 댓글이 달렸습니다.",
                userId,
                TargetType.reply,
                saved.getReplyId(),
                "/community/boards/" + boardId
            );
        }
    }

    @Override
    public void createChildReply(int boardId, int parentId, ReplyCreateRequest request) {
        String userId = requireCurrentUserId();

        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        Reply parent = replyRepository.findById(parentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REPLY_NOT_FOUND));

        if (!Objects.equals(boardId, parent.getBoardId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Reply child = Reply.builder()
            .boardId(boardId)
            .userId(userId)
            .replyCtnt(bannedWordService.filter(request.getReplyCtnt()))
            .anonymity("Y".equalsIgnoreCase(request.getAnonymity()) ? "Y" : "N")
            .parentId(parentId)
            .replyLev(2)
            .replySeq(1)
            .build();

        Reply saved = replyRepository.save(child);
        board.markReply(true);

        if (!userId.equals(parent.getUserId())) {
            notificationService.notifyUser(
                parent.getUserId(),
                "BRD_REREPLY",
                "작성하신 댓글에 답글이 달렸습니다.",
                userId,
                TargetType.reply,
                saved.getReplyId(),
                "/community/boards/" + boardId
            );
        }
    }

    @Override
    public void updateReply(int replyId, ReplyUpdateRequest request) {
        Reply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REPLY_NOT_FOUND));

        String me = requireCurrentUserId();
        if (!me.equals(reply.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (request.getReplyCtnt() != null) {
            reply.setReplyCtnt(bannedWordService.filter(request.getReplyCtnt()));
        }
        if (request.getAnonymity() != null) {
            reply.setAnonymity(request.getAnonymity());
        }
    }

    @Override
    public void deleteReply(int replyId) {
        Reply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REPLY_NOT_FOUND));

        String me = requireCurrentUserId();
        if (!me.equals(reply.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Integer boardId = reply.getBoardId();
        replyRepository.deleteById(replyId);

        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));

        board.markReply(replyRepository.countByBoardId(boardId) > 0);
    }

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
        try {
            return requireCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }

    private String requireCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) throw new BusinessException(ErrorCode.UNAUTHORIZED);

        Object p = auth.getPrincipal();
        if (p instanceof AuthUser au) return au.getUserId();
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
}
