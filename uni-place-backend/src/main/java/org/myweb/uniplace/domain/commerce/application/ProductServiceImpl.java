package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductWithBuildingStockResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.entity.ProductBuildingStock;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;
import org.myweb.uniplace.domain.commerce.repository.ProductBuildingStockRepository;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductBuildingStockRepository buildingStockRepository;

    // ── 기본 상품 조회 ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllOnSaleProducts() {
        return productRepository.findAll()
                .stream()
                .filter(p -> p.getProdSt() == ProductStatus.on_sale)
                .toList();
    }

    /**
     * 빌딩별 재고 포함 전체 상품 목록
     * - 상품당 모든 빌딩의 재고를 Map<buildingId, stock>으로 묶어 반환
     */
    @Override
    @Transactional(readOnly = true)
    public List<ProductWithBuildingStockResponse> getAllOnSaleProductsWithBuildingStocks() {
        List<Product> products = getAllOnSaleProducts();
        if (products.isEmpty()) return List.of();

        List<Integer> prodIds = products.stream()
                .map(Product::getProdId)
                .toList();

        List<ProductBuildingStock> allStocks = buildingStockRepository.findAll()
                .stream()
                .filter(s -> prodIds.contains(s.getProdId()))
                .toList();

        // prodId → [stocks] 그룹핑
        Map<Integer, List<ProductBuildingStock>> stockMap = allStocks.stream()
                .collect(Collectors.groupingBy(ProductBuildingStock::getProdId));

        return products.stream()
                .map(p -> new ProductWithBuildingStockResponse(
                        p,
                        stockMap.getOrDefault(p.getProdId(), List.of())
                ))
                .toList();
    }

    /**
     * 관리자용: 전체 상품(on_sale + sold_out) + 빌딩별 재고 포함
     */
    @Override
    @Transactional(readOnly = true)
    public List<ProductWithBuildingStockResponse> getAllProductsWithBuildingStocks() {
        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) return List.of();

        List<Integer> prodIds = products.stream()
                .map(Product::getProdId)
                .toList();

        List<ProductBuildingStock> allStocks = buildingStockRepository.findAll()
                .stream()
                .filter(s -> prodIds.contains(s.getProdId()))
                .toList();

        Map<Integer, List<ProductBuildingStock>> stockMap = allStocks.stream()
                .collect(Collectors.groupingBy(ProductBuildingStock::getProdId));

        return products.stream()
                .map(p -> new ProductWithBuildingStockResponse(
                        p,
                        stockMap.getOrDefault(p.getProdId(), List.of())
                ))
                .toList();
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public Product createProduct(ProductCreateRequest request) {
        Product product = new Product();
        product.setProdNm(request.getProdNm());
        product.setProdPrice(request.getProdPrice());
        product.setProdStock(request.getProdStock());
        product.setCode(request.getCode());
        product.setProdDesc(request.getProdDesc());
        product.setAffiliateId(request.getAffiliateId());
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public void updateProduct(Integer prodId, ProductUpdateRequest request) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setProdNm(request.getProdNm());
        product.setProdPrice(request.getProdPrice());
        product.setProdStock(request.getProdStock());
        product.setCode(request.getCode());
        product.setProdDesc(request.getProdDesc());
        product.setAffiliateId(request.getAffiliateId());
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void changeStatus(Integer prodId, ProductStatus status) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setProdSt(status);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Integer prodId) {
        productRepository.deleteById(prodId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProduct(Integer prodId) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        return new ProductResponse(product);
    }

    // ── 빌딩별 재고 관리 ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ProductBuildingStockResponse> getBuildingStocks(Integer prodId) {
        return buildingStockRepository.findByProdId(prodId).stream()
                .map(ProductBuildingStockResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductBuildingStockResponse getBuildingStock(Integer prodId, Integer buildingId) {
        return buildingStockRepository.findByProdIdAndBuildingId(prodId, buildingId)
                .map(ProductBuildingStockResponse::new)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    @Override
    @Transactional
    public ProductBuildingStockResponse upsertBuildingStock(Integer prodId, Integer buildingId, Integer stock) {
        // 상품 존재 검증
        productRepository.findById(prodId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductBuildingStock entity = buildingStockRepository
                .findByProdIdAndBuildingId(prodId, buildingId)
                .orElseGet(() -> ProductBuildingStock.builder()
                        .prodId(prodId)
                        .buildingId(buildingId)
                        .stock(0)
                        .build());

        // 빌더 이후 stock 세팅은 reflection이 필요하므로 새 객체 생성
        ProductBuildingStock updated = ProductBuildingStock.builder()
                .stockId(entity.getStockId())
                .prodId(prodId)
                .buildingId(buildingId)
                .stock(stock)
                .updatedAt(java.time.LocalDateTime.now())
                .build();

        return new ProductBuildingStockResponse(buildingStockRepository.save(updated));
    }

    @Override
    @Transactional
    public ProductBuildingStock decreaseBuildingStock(Integer prodId, Integer buildingId, int quantity) {
        ProductBuildingStock stock = buildingStockRepository
                .findByProdIdAndBuildingIdWithLock(prodId, buildingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OUT_OF_STOCK));
        stock.decreaseStock(quantity);
        return stock;
    }

    @Override
    @Transactional
    public void restoreBuildingStock(Integer prodId, Integer buildingId, int quantity) {
        buildingStockRepository
                .findByProdIdAndBuildingId(prodId, buildingId)
                .ifPresent(s -> s.restoreStock(quantity));
    }
}