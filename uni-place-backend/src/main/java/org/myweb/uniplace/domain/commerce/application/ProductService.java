package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.entity.Product.ProductStatus;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductResponse createProduct(ProductCreateRequest request) {
        Product product = Product.builder()
                .prodName(request.getProdName())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(request.getCategory())
                .prodDesc(request.getProdDesc())
                .status(ProductStatus.on_sale)
                .affiliateId(request.getAffiliateId())
                .build();
        productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponse updateProduct(Integer prodId, ProductUpdateRequest request) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + prodId));
        product.update(
                request.getProdName(),
                request.getPrice(),
                request.getStock(),
                request.getCategory(),
                request.getProdDesc(),
                request.getStatus(),
                request.getAffiliateId()
        );
        return toResponse(product);
    }

    public ProductResponse getProduct(Integer prodId) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + prodId));
        return toResponse(product);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .prodId(product.getProdId())
                .prodName(product.getProdName())
                .price(product.getPrice())
                .stock(product.getStock())
                .category(product.getCategory())
                .prodDesc(product.getProdDesc())
                .status(product.getStatus())
                .affiliateId(product.getAffiliateId())
                .build();
    }
}