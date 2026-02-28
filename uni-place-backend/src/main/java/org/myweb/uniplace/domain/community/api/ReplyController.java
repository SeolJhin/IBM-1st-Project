package org.myweb.uniplace.domain.community.api;

import java.util.List;

import org.myweb.uniplace.domain.community.api.dto.request.ReplyCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.ReplyUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.ReplyResponse;
import org.myweb.uniplace.domain.community.application.LikeService;
import org.myweb.uniplace.domain.community.application.ReplyService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ReplyController {

    private final ReplyService replyService;
    private final LikeService likeService;

 // 내가 작성한 댓글 목록
    @GetMapping("/replies/me")
    public ResponseEntity<ApiResponse<PageResponse<ReplyResponse>>> myReplies(
            @PageableDefault(size = 10, sort = "replyId", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(replyService.getMyReplies(pageable)));
    }
    
    // 댓글 조회
    @GetMapping("/boards/{boardId}/replies")
    public ResponseEntity<ApiResponse<List<ReplyResponse>>> getRepliesByBoard(@PathVariable("boardId") int boardId) {
        return ResponseEntity.ok(ApiResponse.ok(replyService.getRepliesByBoard(boardId)));
    }

    // 대댓글 조회
    @GetMapping("/boards/{boardId}/replies/{parentId}/children")
    public ResponseEntity<ApiResponse<List<ReplyResponse>>> getChildReplies(
            @PathVariable("boardId") int boardId,
            @PathVariable("parentId") int parentId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(replyService.getChildReplies(boardId, parentId)));
    }

    // 댓글 등록
    @PostMapping("/boards/{boardId}/replies")
    public ResponseEntity<ApiResponse<Void>> createReply(
            @PathVariable("boardId") int boardId,
            @ModelAttribute ReplyCreateRequest request
    ) {
        replyService.createReply(boardId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 대댓글 등록
    @PostMapping("/boards/{boardId}/replies/{parentId}/children")
    public ResponseEntity<ApiResponse<Void>> createChildReply(
            @PathVariable("boardId") int boardId,
            @PathVariable("parentId") int parentId,
            @ModelAttribute ReplyCreateRequest request
    ) {
        replyService.createChildReply(boardId, parentId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 댓글/대댓글 수정
    @PutMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> replyUpdate(
            @PathVariable("replyId") int replyId,
            @ModelAttribute ReplyUpdateRequest request
    ) {
        replyService.updateReply(replyId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 댓글 삭제
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> replyDelete(@PathVariable("replyId") int replyId) {
        replyService.deleteReply(replyId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 댓글 좋아요 등록
    @PostMapping("/replies/{replyId}/likes")
    public ResponseEntity<ApiResponse<Void>> likeReply(
            @PathVariable("replyId") int replyId,
            @AuthenticationPrincipal AuthUser user
    ) {
        likeService.likeReply(replyId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 댓글 좋아요 취소
    @DeleteMapping("/replies/{replyId}/likes")
    public ResponseEntity<ApiResponse<Void>> unlikeReply(
            @PathVariable("replyId") int replyId,
            @AuthenticationPrincipal AuthUser user
    ) {
        likeService.unlikeReply(replyId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}