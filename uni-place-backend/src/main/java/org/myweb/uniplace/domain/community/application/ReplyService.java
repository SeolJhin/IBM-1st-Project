package org.myweb.uniplace.domain.community.application;

import java.util.List;

import org.myweb.uniplace.domain.community.api.dto.request.ReplyCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.ReplyUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.ReplyResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ReplyService {

    List<ReplyResponse> getRepliesByBoard(int boardId);
    
    PageResponse<ReplyResponse> getMyReplies(Pageable pageable);

    List<ReplyResponse> getChildReplies(int boardId, int parentId);

    void createReply(int boardId, ReplyCreateRequest request);

    void createChildReply(int boardId, int parentId, ReplyCreateRequest request);

    void updateReply(int replyId, ReplyUpdateRequest request);

    void deleteReply(int replyId);
}