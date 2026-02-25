package org.myweb.uniplace.domain.support.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.*;
import org.myweb.uniplace.domain.support.api.dto.response.QnaResponse;
import org.myweb.uniplace.domain.support.application.QnaService;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/qna")
public class QnaController {

    private final QnaService qnaService;

    /** QNA 목록 조회 - 본인 질문 목록 */
    @GetMapping
    public ApiResponse<PageResponse<QnaResponse>> search(
            @ModelAttribute QnaSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "qnaId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(qnaService.search(request, pageable));
    }

    /** QNA 전체 관리용 목록 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public ApiResponse<PageResponse<QnaResponse>> searchAll(
            @ModelAttribute QnaSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "qnaId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 20;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(qnaService.searchAll(request, pageable));
    }

    /** QNA 상세 조회 */
    @GetMapping("/{qnaId}")
    public ApiResponse<QnaResponse> detail(
            @PathVariable("qnaId") Integer qnaId
    ) {
        return ApiResponse.ok(qnaService.get(qnaId));
    }

    /** QNA 답변 목록 조회 */
    @GetMapping("/{qnaId}/replies")
    public ApiResponse<List<QnaResponse>> replies(
            @PathVariable("qnaId") Integer qnaId
    ) {
        return ApiResponse.ok(qnaService.getReplies(qnaId));
    }

    /** QNA 질문 등록 */
    @PostMapping
    public ApiResponse<QnaResponse> create(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody QnaCreateRequest request
    ) {
        return ApiResponse.ok(qnaService.create(requireUserId(authUser), request));
    }

    /** QNA 수정 */
    @PutMapping("/{qnaId}")
    public ApiResponse<QnaResponse> update(
            @PathVariable("qnaId") Integer qnaId,
            @Valid @RequestBody QnaUpdateRequest request
    ) {
        return ApiResponse.ok(qnaService.update(qnaId, request));
    }

    /** QNA 삭제 */
    @DeleteMapping("/{qnaId}")
    public ApiResponse<Void> delete(
            @PathVariable("qnaId") Integer qnaId
    ) {
        qnaService.delete(qnaId);
        return ApiResponse.ok();
    }

    /** 관리자 답변 등록 */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{qnaId}/answer")
    public ApiResponse<QnaResponse> createAnswer(
            @PathVariable("qnaId") Integer qnaId,
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody QnaAnswerRequest request
    ) {
        return ApiResponse.ok(qnaService.createAnswer(qnaId, requireUserId(authUser), request));
    }

    /** 관리자 답변 수정 */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{qnaId}/answer")
    public ApiResponse<QnaResponse> updateAnswer(
            @PathVariable("qnaId") Integer qnaId,
            @Valid @RequestBody QnaAnswerRequest request
    ) {
        return ApiResponse.ok(qnaService.updateAnswer(qnaId, request));
    }

    /** QNA 상태 변경 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{qnaId}/status")
    public ApiResponse<QnaResponse> updateStatus(
            @PathVariable("qnaId") Integer qnaId,
            @Valid @RequestBody QnaStatusUpdateRequest request
    ) {
        return ApiResponse.ok(qnaService.updateStatus(qnaId, request));
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
