package org.myweb.uniplace.domain.support.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.QnaAnswerRequest;
import org.myweb.uniplace.domain.support.api.dto.request.QnaCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.QnaSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.QnaStatusUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.QnaUpdateRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/qna")
public class QnaController {

    private final QnaService qnaService;

    // QnA 목록 조회: 관리자 또는 본인 작성글만 조회
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ApiResponse<PageResponse<QnaResponse>> search(
            @AuthenticationPrincipal AuthUser authUser,
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

        return ApiResponse.ok(
                qnaService.search(request, pageable, requireUserId(authUser), isAdmin(authUser))
        );
    }

    // 관리자용 전체 목록
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

    // QnA 상세 조회: 관리자 또는 작성자만 가능
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{qnaId}")
    public ApiResponse<QnaResponse> detail(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("qnaId") Integer qnaId
    ) {
        return ApiResponse.ok(
                qnaService.get(qnaId, requireUserId(authUser), isAdmin(authUser))
        );
    }

    // 답변 조회: 관리자 또는 질문 작성자만 가능
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{qnaId}/replies")
    public ApiResponse<List<QnaResponse>> replies(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable("qnaId") Integer qnaId
    ) {
        return ApiResponse.ok(
                qnaService.getReplies(qnaId, requireUserId(authUser), isAdmin(authUser))
        );
    }

    // 질문 작성: 관리자 + 입주민
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT')")
    @PostMapping
    public ApiResponse<QnaResponse> create(
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody QnaCreateRequest request
    ) {
        return ApiResponse.ok(qnaService.create(requireUserId(authUser), request));
    }

    // 질문 수정: 관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{qnaId}")
    public ApiResponse<QnaResponse> update(
            @PathVariable("qnaId") Integer qnaId,
            @Valid @RequestBody QnaUpdateRequest request
    ) {
        return ApiResponse.ok(qnaService.update(qnaId, request));
    }

    // 질문 삭제: 관리자만
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{qnaId}")
    public ApiResponse<Void> delete(
            @PathVariable("qnaId") Integer qnaId
    ) {
        qnaService.delete(qnaId);
        return ApiResponse.ok();
    }

    // 관리자 답변 등록
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{qnaId}/answer")
    public ApiResponse<QnaResponse> createAnswer(
            @PathVariable("qnaId") Integer qnaId,
            @AuthenticationPrincipal AuthUser authUser,
            @Valid @RequestBody QnaAnswerRequest request
    ) {
        return ApiResponse.ok(qnaService.createAnswer(qnaId, requireUserId(authUser), request));
    }

    // 관리자 답변 수정
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{qnaId}/answer")
    public ApiResponse<QnaResponse> updateAnswer(
            @PathVariable("qnaId") Integer qnaId,
            @Valid @RequestBody QnaAnswerRequest request
    ) {
        return ApiResponse.ok(qnaService.updateAnswer(qnaId, request));
    }

    // 관리자 상태 변경
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

    private boolean isAdmin(AuthUser authUser) {
        if (authUser == null) return false;
        return "admin".equalsIgnoreCase(String.valueOf(authUser.getRole()).trim());
    }
}