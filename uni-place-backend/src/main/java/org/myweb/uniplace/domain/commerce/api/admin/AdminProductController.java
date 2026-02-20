package org.myweb.uniplace.domain.commerce.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * 관리자용 Product Controller
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/products")
public class AdminProductController {

    private final ProductService productService;

    // 상품 생성 → 생성된 ID 반환
    @PostMapping
    public ApiResponse<Integer> create(@RequestBody @Valid ProductCreateRequest request) {
        return ApiResponse.ok(productService.createProduct(request).getProdId());
    }

    // 상품 수정
    @PutMapping("/{prodId}")
    public ApiResponse<Void> update(@PathVariable Integer prodId,
                                    @RequestBody @Valid ProductUpdateRequest request) {
        productService.updateProduct(prodId, request);
        return ApiResponse.ok();
    }

    // 상품 상태 변경
    @PatchMapping("/{prodId}/status")
    public ApiResponse<Void> changeStatus(@PathVariable Integer prodId,
                                          @RequestBody ProductStatus status) {
        productService.changeStatus(prodId, status);
        return ApiResponse.ok();
    }

    // 상품 삭제
    @DeleteMapping("/{prodId}")
    public ApiResponse<Void> delete(@PathVariable Integer prodId) {
        productService.deleteProduct(prodId);
        return ApiResponse.ok();
    }
}