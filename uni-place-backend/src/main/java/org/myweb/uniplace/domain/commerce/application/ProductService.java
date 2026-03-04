package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductWithBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.entity.ProductBuildingStock;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;

import java.util.List;

public interface ProductService {

    List<Product> getAllOnSaleProducts();

    /**
     * 빌딩별 재고 포함 전체 상품 목록 (on_sale 만)
     */
    List<ProductWithBuildingStockResponse> getAllOnSaleProductsWithBuildingStocks();

    /**
     * 빌딩별 재고 포함 전체 상품 목록 (관리자용 - sold_out 포함)
     */
    List<ProductWithBuildingStockResponse> getAllProductsWithBuildingStocks();

    Product createProduct(ProductCreateRequest request);

    void updateProduct(Integer prodId, ProductUpdateRequest request);

    void changeStatus(Integer prodId, ProductStatus status);

    void deleteProduct(Integer prodId);

    ProductResponse getProduct(Integer prodId);

    // ── 빌딩별 재고 관리 ──────────────────────────────────────────────────────

    /**
     * 특정 상품의 빌딩별 재고 목록
     */
    List<ProductBuildingStockResponse> getBuildingStocks(Integer prodId);

    /**
     * 특정 상품 + 빌딩의 재고 조회
     */
    ProductBuildingStockResponse getBuildingStock(Integer prodId, Integer buildingId);

    /**
     * 빌딩별 재고 설정 (없으면 생성, 있으면 업데이트)
     */
    ProductBuildingStockResponse upsertBuildingStock(Integer prodId, Integer buildingId, Integer stock);

    /**
     * 재고 차감 (주문 시 내부 호출)
     */
    ProductBuildingStock decreaseBuildingStock(Integer prodId, Integer buildingId, int quantity);

    /**
     * 재고 복원 (주문 취소 시 내부 호출)
     */
    void restoreBuildingStock(Integer prodId, Integer buildingId, int quantity);
}