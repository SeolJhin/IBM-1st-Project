package org.myweb.uniplace.domain.commerce.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping
public class ProductController {

    private final ProductService productService;

    // 상품 목록 조회
    @GetMapping("/products")
    public ApiResponse<PageResponse<ProductResponse>> list(@RequestParam(required = false) String keyword, Pageable pageable) {
        return ApiResponse.ok(PageResponse.of(productService.list(keyword, pageable)));
    }

    // 상품 상세 조회
    @GetMapping("/products/{prodId}")
    public ApiResponse<ProductResponse> detail(@PathVariable Integer prodId) {
        return ApiResponse.ok(productService.detail(prodId));
    }

    // 상품 등록 (관리자)
    @PostMapping("/admin/products")
    public ApiResponse<Integer> create(@RequestBody ProductCreateRequest request) {
        return ApiResponse.ok(productService.create(request));
    }

    // 상품 수정 (관리자)
    @PutMapping("/admin/products/{prodId}")
    public ApiResponse<Void> update(@PathVariable Integer prodId, @RequestBody ProductUpdateRequest request) {
        productService.update(prodId, request);
        return ApiResponse.ok();
    }

    // 상품 상태 변경 (관리자)
    @PatchMapping("/admin/products/{prodId}/status")
    public ApiResponse<Void> changeStatus(@PathVariable Integer prodId, @RequestBody String status) {
        productService.changeStatus(prodId, status);
        return ApiResponse.ok();
    }

    // 상품 삭제 (관리자, 논리삭제)
    @DeleteMapping("/admin/products/{prodId}")
    public ApiResponse<Void> delete(@PathVariable Integer prodId) {
        productService.delete(prodId);
        return ApiResponse.ok();
    }
}