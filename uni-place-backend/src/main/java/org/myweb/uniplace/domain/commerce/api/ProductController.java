package org.myweb.uniplace.domain.commerce.api;

import java.util.List;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

/**
 * 사용자용 Product Controller
 * - 상품 조회 + 상품 이미지 조회
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {

    private static final String PARENT_TYPE_PRODUCT = "PRODUCT";

    private final ProductService productService;
    private final FileService fileService;

    // 단일 상품 조회
    @GetMapping("/{prodId}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable("prodId") Integer prodId) { // ✅ 이름 명시
        return ApiResponse.ok(productService.getProduct(prodId));
    }

    // 전체 상품 조회 (on_sale 상태만)
    @GetMapping
    public ApiResponse<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> list = productService.getAllOnSaleProducts()
                .stream()
                .map(ProductResponse::new)
                .collect(Collectors.toList());
        return ApiResponse.ok(list);
    }

    // ✅ 상품 이미지 목록 조회 (삭제 제외)
    // - 응답에 viewUrl(/files/{fileId}/view) 포함되어 있어서 “이미지 보기” 바로 가능
    @GetMapping("/{prodId}/images")
    public ApiResponse<List<FileResponse>> productImages(@PathVariable("prodId") Integer prodId) {
        // 상품 존재 검증(없으면 404/예외)
        productService.getProduct(prodId);
        return ApiResponse.ok(fileService.getActiveFiles(PARENT_TYPE_PRODUCT, prodId));
    }
}