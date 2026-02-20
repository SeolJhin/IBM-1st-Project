package org.myweb.uniplace.domain.commerce.api;

import java.util.List;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

/**
 * 사용자용 Product Controller
 * - 상품 조회 전용
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;

    // 단일 상품 조회
    @GetMapping("/{prodId}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable Integer prodId) {
        return ApiResponse.ok(productService.getProduct(prodId));
    }

    // 전체 상품 조회 (on_sale 상태만)
    @GetMapping
    public ApiResponse<List<ProductResponse>> getAllProducts() {
        // Service에서 전체 조회 기능을 추가하면 좋지만,
        // 간단히 Repository 사용해도 됨
        List<ProductResponse> list = productService.getAllOnSaleProducts()
                .stream()
                .map(ProductResponse::new)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }
}