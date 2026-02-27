package org.myweb.uniplace.domain.commerce.api;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductWithBuildingStockResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자용 Product Controller
 * - 상품 조회 + 빌딩별 재고 조회
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/products")
public class ProductController {

    private static final String PARENT_TYPE_PRODUCT = "PRODUCT";

    private final org.myweb.uniplace.domain.commerce.application.ProductService productService;
    private final FileService fileService;

    /** 단일 상품 조회 */
    @GetMapping("/{prodId}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable("prodId") Integer prodId) {
        return ApiResponse.ok(productService.getProduct(prodId));
    }

    /**
     * 전체 상품 목록 (on_sale 상태만)
     * - buildingStocks: { buildingId: stock } 맵 포함
     */
    @GetMapping
    public ApiResponse<List<ProductWithBuildingStockResponse>> getAllProducts() {
        return ApiResponse.ok(productService.getAllOnSaleProductsWithBuildingStocks());
    }

    /** 상품 이미지 목록 조회 */
    @GetMapping("/{prodId}/images")
    public ApiResponse<List<FileResponse>> productImages(@PathVariable("prodId") Integer prodId) {
        productService.getProduct(prodId);
        return ApiResponse.ok(fileService.getActiveFiles(PARENT_TYPE_PRODUCT, prodId));
    }

    // ── 빌딩별 재고 조회 ─────────────────────────────────────────────────────

    /**
     * 특정 상품의 빌딩별 재고 목록
     * GET /products/{prodId}/building-stocks
     */
    @GetMapping("/{prodId}/building-stocks")
    public ApiResponse<List<ProductBuildingStockResponse>> getBuildingStocks(
        @PathVariable("prodId") Integer prodId
    ) {
        return ApiResponse.ok(productService.getBuildingStocks(prodId));
    }

    /**
     * 특정 상품 + 빌딩의 재고
     * GET /products/{prodId}/building-stocks/{buildingId}
     */
    @GetMapping("/{prodId}/building-stocks/{buildingId}")
    public ApiResponse<ProductBuildingStockResponse> getBuildingStock(
        @PathVariable("prodId") Integer prodId,
        @PathVariable("buildingId") Integer buildingId
    ) {
        return ApiResponse.ok(productService.getBuildingStock(prodId, buildingId));
    }
}