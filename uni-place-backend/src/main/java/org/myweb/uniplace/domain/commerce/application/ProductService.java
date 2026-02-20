package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    Page<ProductResponse> list(String keyword, Pageable pageable);

    ProductResponse detail(Long prodId);

    Long create(ProductCreateRequest request);

    void update(Long prodId, ProductUpdateRequest request);

    void changeStatus(Long prodId, String status);

    void delete(Long prodId);
}