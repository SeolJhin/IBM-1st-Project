// 경로: org/myweb/uniplace/domain/cart/application/CartService.java
package org.myweb.uniplace.domain.commerce.application;

import org.myweb.uniplace.domain.commerce.api.dto.request.CartAddRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.CartResponse;

public interface CartService {

    CartResponse getMyCart(String userId);

    CartResponse addItem(String userId, CartAddRequest request);

    CartResponse updateQuantity(String userId, Integer cartItemId, CartQuantityUpdateRequest request);

    CartResponse removeItem(String userId, Integer cartItemId);

    void clear(String userId);
}