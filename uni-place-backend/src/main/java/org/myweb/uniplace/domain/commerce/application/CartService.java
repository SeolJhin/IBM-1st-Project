// Service
// 경로: org/myweb/uniplace/domain/commerce/application/CartService.java
package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.CartAddRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.CartUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.CartResponse;

public interface CartService {

    CartResponse addItem(String userId, CartAddRequest request);

    CartResponse getMyCart(String userId);

    CartResponse updateQuantity(String userId, Integer cartItemId, CartUpdateRequest request);

    void deleteItem(String userId, Integer cartItemId);

    void clearMyCart(String userId);
}