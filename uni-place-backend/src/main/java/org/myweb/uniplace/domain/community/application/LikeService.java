package org.myweb.uniplace.domain.community.application;

public interface LikeService {

    void likeBoard(int boardId, String userId);

    void unlikeBoard(int boardId, String userId);

    void likeReply(int replyId, String userId);

    void unlikeReply(int replyId, String userId);
}