package org.myweb.uniplace.domain.support.api;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.support.api.dto.request.FaqCreateRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqSearchRequest;
import org.myweb.uniplace.domain.support.api.dto.request.FaqUpdateRequest;
import org.myweb.uniplace.domain.support.api.dto.response.FaqResponse;
import org.myweb.uniplace.domain.support.application.FaqService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/faqs")
public class FaqController {

    private final FaqService faqService;

    /** FAQ 목록 */
    @GetMapping
    public ApiResponse<PageResponse<FaqResponse>> search(
            @ModelAttribute FaqSearchRequest request,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "faqId") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction =
                "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page - 1, size, direction, sort);

        return ApiResponse.ok(faqService.search(request, pageable));
    }

    /** FAQ 상세 */
    @GetMapping("/{faqId}")
    public ApiResponse<FaqResponse> detail(
            @PathVariable("faqId") Integer faqId
    ) {
        return ApiResponse.ok(faqService.get(faqId));
    }

    /** FAQ 등록 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ApiResponse<FaqResponse> create(
            @Valid @RequestBody FaqCreateRequest request
    ) {
        return ApiResponse.ok(faqService.create(request));
    }

    /** FAQ 수정 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{faqId}")
    public ApiResponse<FaqResponse> update(
            @PathVariable("faqId") Integer faqId,
            @Valid @RequestBody FaqUpdateRequest request
    ) {
        return ApiResponse.ok(faqService.update(faqId, request));
    }

    /** FAQ 삭제 (관리자) */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{faqId}")
    public ApiResponse<Void> delete(
            @PathVariable("faqId") Integer faqId
    ) {
        faqService.delete(faqId);
        return ApiResponse.ok();
    }
}
