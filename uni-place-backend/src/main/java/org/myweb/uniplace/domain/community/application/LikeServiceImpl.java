package org.myweb.uniplace.domain.community.application;

import org.myweb.uniplace.domain.community.domain.entity.*;
import org.myweb.uniplace.domain.community.repository.*;
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

    @Override
    public void likeBoard(int boardId, String userId) {
        boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("게시글이 존재하지 않습니다. boardId=" + boardId));

        BoardLike.Id id = new BoardLike.Id(userId, boardId);
        if (boardLikeRepository.existsById(id)) return;

        boardLikeRepository.save(BoardLike.builder().id(id).build());
    }

    @Override
    public void unlikeBoard(int boardId, String userId) {
        BoardLike.Id id = new BoardLike.Id(userId, boardId);
        if (!boardLikeRepository.existsById(id)) return;

        boardLikeRepository.deleteById(id);
    }

    @Override
    public void likeReply(int replyId, String userId) {
        replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("댓글이 존재하지 않습니다. replyId=" + replyId));

        ReplyLike.Id id = new ReplyLike.Id(userId, replyId);
        if (replyLikeRepository.existsById(id)) return;

        replyLikeRepository.save(ReplyLike.builder().id(id).build());
    }

    @Override
    public void unlikeReply(int replyId, String userId) {
        ReplyLike.Id id = new ReplyLike.Id(userId, replyId);
        if (!replyLikeRepository.existsById(id)) return;

        replyLikeRepository.deleteById(id);
    }
}