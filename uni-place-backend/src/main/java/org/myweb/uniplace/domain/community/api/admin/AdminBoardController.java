package org.myweb.uniplace.domain.community.api.admin;

import org.myweb.uniplace.domain.community.api.admin.dto.request.BoardImportanceUpdateRequest;
import org.myweb.uniplace.domain.community.application.AdminBoardService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminBoardController {

    private final AdminBoardService adminBoardService;

    /**
     * ✅ 관리자 게시글 삭제
     */
    @DeleteMapping("/boards/{boardId}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteBoard(@PathVariable int boardId) {
        adminBoardService.deleteBoardAsAdmin(boardId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * ✅ 관리자 댓글 삭제
     */
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<ApiResponse<Void>> adminDeleteReply(@PathVariable int replyId) {
        adminBoardService.deleteReplyAsAdmin(replyId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * ✅ 중요도/중요기간 설정(관리자)
     * - importance: "Y"/"N"
     * - impEndAt: 중요공지 종료일(없으면 null 가능)
     */
    @PatchMapping("/boards/{boardId}/importance")
    public ResponseEntity<ApiResponse<Void>> updateImportance(
            @PathVariable int boardId,
            @RequestBody BoardImportanceUpdateRequest request
    ) {
        adminBoardService.updateImportance(boardId, request);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}