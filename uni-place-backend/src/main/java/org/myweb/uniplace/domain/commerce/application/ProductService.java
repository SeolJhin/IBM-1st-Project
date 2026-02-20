package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;

import java.util.List;

/**
 * Product Service 인터페이스
 */
public interface ProductService {

    Product createProduct(ProductCreateRequest request);

    void updateProduct(Integer prodId, ProductUpdateRequest request);

    void changeStatus(Integer prodId, ProductStatus status);

    void deleteProduct(Integer prodId);

    ProductResponse getProduct(Integer prodId);
    
    List<Product> getAllOnSaleProducts();  // java.util.List 사용
}