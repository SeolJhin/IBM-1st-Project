// ServiceImpl
// 경로: org/myweb/uniplace/domain/commerce/application/CartServiceImpl.java
package org.myweb.uniplace.domain.commerce.application;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.commerce.api.dto.request.CartAddRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.CartUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.CartResponse;
import org.myweb.uniplace.domain.commerce.domain.entity.Cart;
import org.myweb.uniplace.domain.commerce.domain.entity.CartItem;
import org.myweb.uniplace.domain.commerce.repository.CartItemRepository;
import org.myweb.uniplace.domain.commerce.repository.CartRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Override
    public CartResponse addItem(String userId, CartAddRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder()
                                .userId(userId)
                                .build()
                ));

        Optional<CartItem> existing = cartItemRepository.findByCartIdAndProdId(cart.getCartId(), request.getProdId());

        CartItem saved;
        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setOrderQuantity(item.getOrderQuantity() + request.getOrderQuantity());
            // order_price는 "행 단가/가격" 컬럼이므로, 들어온 값으로 최신화(프로젝트 정책에 맞게 변경 가능)
            item.setOrderPrice(request.getOrderPrice());
            saved = cartItemRepository.save(item);
        } else {
            saved = cartItemRepository.save(
                    CartItem.builder()
                            .cartId(cart.getCartId())
                            .prodId(request.getProdId())
                            .orderQuantity(request.getOrderQuantity())
                            .orderPrice(request.getOrderPrice())
                            .build()
            );
        }

        return buildCartResponse(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return buildCartResponse(cart);
    }

    @Override
    public CartResponse updateQuantity(String userId, Integer cartItemId, CartUpdateRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (!cart.getCartId().equals(item.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        item.setOrderQuantity(request.getOrderQuantity());
        cartItemRepository.save(item);

        return buildCartResponse(cart);
    }

    @Override
    public void deleteItem(String userId, Integer cartItemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        if (!cart.getCartId().equals(item.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        cartItemRepository.delete(item);
    }

    @Override
    public void clearMyCart(String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));

        cartItemRepository.deleteByCartId(cart.getCartId());
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> items = cartItemRepository.findByCartIdOrderByCartItemIdDesc(cart.getCartId());

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUserId())
                .cartCreatedAt(cart.getCartCreatedAt())
                .items(
                        items.stream()
                                .map(i -> CartResponse.CartItemResponse.builder()
                                        .cartItemId(i.getCartItemId())
                                        .prodId(i.getProdId())
                                        .orderQuantity(i.getOrderQuantity())
                                        .orderPrice(i.getOrderPrice())
                                        .build()
                                )
                                .collect(Collectors.toList())
                )
                .build();
    }
}