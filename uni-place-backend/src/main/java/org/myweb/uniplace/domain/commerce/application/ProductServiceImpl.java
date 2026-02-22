package org.myweb.uniplace.domain.commerce.application;

import java.util.List;

import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * Product Service 구현체
 */
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllOnSaleProducts() {
        return productRepository.findAll()
                .stream()
                .filter(p -> p.getProdSt() == ProductStatus.on_sale)
                .toList();
    }

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
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));
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
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));
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
                .orElseThrow(() -> new IllegalArgumentException("상품이 존재하지 않습니다."));
        return new ProductResponse(product);
    }
}