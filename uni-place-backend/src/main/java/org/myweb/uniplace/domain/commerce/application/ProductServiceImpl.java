package org.myweb.uniplace.domain.commerce.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    public Page<ProductResponse> list(String keyword, Pageable pageable) {
        return productRepository
                .findByProdNameContainingIgnoreCaseAndDeleteYn(keyword == null ? "" : keyword, "N", pageable)
                .map(ProductResponse::fromEntity);
    }

    @Override
    public ProductResponse detail(Integer prodId) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));
        return ProductResponse.fromEntity(product);
    }

    @Override
    @Transactional
    public Integer create(ProductCreateRequest request) {
        if (productRepository.existsByProdName(request.getProdName())) {
            throw new IllegalArgumentException("이미 존재하는 상품명입니다.");
        }
        Product product = Product.builder()
                .prodName(request.getProdName())
                .prodDesc(request.getProdDesc())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .build();
        return (int) productRepository.save(product).getProdId().longValue();
    }

    @Override
    @Transactional
    public void update(Integer prodId, ProductUpdateRequest request) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));
        product.update(request.getProdName(), request.getProdDesc(), request.getPrice(), request.getStock(), request.getCategory(), request.getImageUrl());
    }

    @Override
    @Transactional
    public void changeStatus(Integer prodId, String status) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));
        product.updateStatus(status);
    }

    @Override
    @Transactional
    public void delete(Integer prodId) {
        Product product = productRepository.findById(prodId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));
        product.softDelete();
    }
}