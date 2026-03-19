package org.myweb.uniplace.domain.community.api;

import org.myweb.uniplace.domain.community.api.dto.request.BoardCreateRequest;
import org.myweb.uniplace.domain.community.api.dto.request.BoardUpdateRequest;
import org.myweb.uniplace.domain.community.api.dto.response.BoardResponse;
import org.myweb.uniplace.domain.community.application.BoardService;
import org.myweb.uniplace.domain.community.application.LikeService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/boards")
public class BoardController {

    private final BoardService boardService;
    private final LikeService likeService;
    
    
    // 내가 작성한 게시글 목록
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<BoardResponse>>> myBoardList(
            @RequestParam(name = "boardType", required = false) String boardType,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(boardService.getMyBoards(boardType, pageable)));
    }
    
    
    // 게시판 검색 (제목 또는 userId)
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<BoardResponse>>> boardSearch(
            @RequestParam(name = "boardType", required = false) String boardType,
            @RequestParam(name = "searchType", defaultValue = "title") String searchType,
            @RequestParam(name = "keyword", required = false, defaultValue = "") String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(boardService.searchBoards(boardType, searchType, keyword, pageable)));
    }

    // 게시판 조회
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<BoardResponse>>> boardList(
            @RequestParam(name = "boardType", required = false) String boardType,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(boardService.getBoardList(boardType, pageable)));
    }

    // 게시판 등록
    @PostMapping
    public ResponseEntity<ApiResponse<Integer>> boardCreate(
            @ModelAttribute BoardCreateRequest request,
            @RequestParam(name = "ofile", required = false) MultipartFile file
    ) {
        int boardId = boardService.createBoard(request, file);
        return ResponseEntity.ok(ApiResponse.ok(boardId));
    }

    // 게시판 상세 보기
    @GetMapping("/{boardId}")
    public ResponseEntity<ApiResponse<BoardResponse>> boardDetail(
            @PathVariable("boardId") int boardId,
            @RequestParam(name = "increaseReadCount", defaultValue = "true") boolean increaseReadCount
    ) {
        return ResponseEntity.ok(ApiResponse.ok(boardService.getBoardDetail(boardId, increaseReadCount)));
    }

    // 게시글 좋아요 등록
    @PostMapping("/{boardId}/likes")
    public ResponseEntity<ApiResponse<Void>> likeBoard(
            @PathVariable("boardId") int boardId,
            @AuthenticationPrincipal AuthUser user
    ) {
        likeService.likeBoard(boardId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 게시글 좋아요 취소
    @DeleteMapping("/{boardId}/likes")
    public ResponseEntity<ApiResponse<Void>> unlikeBoard(
            @PathVariable("boardId") int boardId,
            @AuthenticationPrincipal AuthUser user
    ) {
        likeService.unlikeBoard(boardId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 게시판 수정
    @PutMapping("/{boardId}")
    public ResponseEntity<ApiResponse<Void>> boardUpdate(
            @PathVariable("boardId") int boardId,
            @ModelAttribute BoardUpdateRequest request,
            @RequestParam(name = "deleteFlag", defaultValue = "false") boolean deleteFlag,
            @RequestParam(name = "ofile", required = false) MultipartFile file
    ) {
        boardService.updateBoard(boardId, request, deleteFlag, file);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // 게시판 삭제
    @DeleteMapping("/{boardId}")
    public ResponseEntity<ApiResponse<Void>> boardDelete(@PathVariable("boardId") int boardId) {
        boardService.deleteBoard(boardId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}