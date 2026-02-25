// org/myweb/uniplace/domain/commerce/application/CartServiceImpl.java
package org.myweb.uniplace.domain.commerce.application;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.commerce.api.dto.request.*;
import org.myweb.uniplace.domain.commerce.api.dto.response.*;
import org.myweb.uniplace.domain.commerce.domain.entity.*;
import org.myweb.uniplace.domain.commerce.repository.*;

import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private static final String FILE_PARENT_TYPE_PRODUCT = "product";

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CartFileQueryRepository cartFileQueryRepository;

    // ===================== 조회 =====================

    /**
     * 내 카트 조회
     * - 카트가 없어도 생성하지 않음
     * - readOnly 안전
     */
    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(String userId) {

        if (userId == null || userId.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Cart cart = cartRepository
            .findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
            .orElse(null);

        if (cart == null) {
            return CartResponse.builder()
                .cartId(null)
                .userId(userId)
                .items(List.of())
                .totalAmount(BigDecimal.ZERO)
                .totalQuantity(0)
                .build();
        }

        return buildResponse(cart);
    }

    // ===================== 담기 =====================

    /**
     * 상품 담기
     * - 여기서만 카트 자동 생성
     */
    @Override
    public CartResponse addItem(String userId, CartAddRequest request) {

        if (request == null || request.getProdId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Product product = productRepository.findById(request.getProdId())
            .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        Cart cart = getOrCreateCart(userId);
        int qty = Math.max(1, Optional.ofNullable(request.getQuantity()).orElse(1));

        try {
            CartItem item = cartItemRepository
                .findByCartIdAndProdId(cart.getCartId(), product.getProdId())
                .orElse(null);

            if (item == null) {
                cartItemRepository.save(
                    CartItem.builder()
                        .cartId(cart.getCartId())
                        .prodId(product.getProdId())
                        .orderQuantity(qty)
                        .orderPrice(product.getProdPrice())
                        .build()
                );
            } else {
                item.increase(qty);
            }
        } catch (DataIntegrityViolationException e) {
            // 동시성 대응
            cartItemRepository
                .findByCartIdAndProdId(cart.getCartId(), product.getProdId())
                .ifPresent(i -> i.increase(qty));
        }

        return buildResponse(cart);
    }

    // ===================== 수량 변경 =====================

    @Override
    public CartResponse updateQuantity(
        String userId,
        Integer cartItemId,
        CartQuantityUpdateRequest request
    ) {

        if (cartItemId == null || request == null || request.getQuantity() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Cart cart = getCartOrThrow(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        item.changeQuantity(request.getQuantity());
        return buildResponse(cart);
    }

    // ===================== 아이템 삭제 =====================

    @Override
    public CartResponse removeItem(String userId, Integer cartItemId) {

        if (cartItemId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        Cart cart = getCartOrThrow(userId);

        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.ORDER_ACCESS_DENIED);
        }

        cartItemRepository.delete(item);
        return buildResponse(cart);
    }

    // ===================== 카트 비우기 =====================

    @Override
    public void clear(String userId) {

        Cart cart = cartRepository
            .findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
            .orElse(null);

        if (cart == null) {
            return; // 비어있으면 아무 것도 안 함
        }

        cartItemRepository.deleteByCartId(cart.getCartId());
    }

    // ===================== private =====================

    /**
     * 담기 전용
     */
    private Cart getOrCreateCart(String userId) {

        if (userId == null || userId.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        return cartRepository
            .findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
            .orElseGet(() ->
                cartRepository.save(
                    Cart.builder()
                        .userId(userId)
                        .build()
                )
            );
    }

    /**
     * 수정/삭제 전용
     */
    private Cart getCartOrThrow(String userId) {

        if (userId == null || userId.isBlank()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        return cartRepository
            .findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));
    }

    private CartResponse buildResponse(Cart cart) {

        List<CartItem> items = cartItemRepository.findByCartId(cart.getCartId());

        if (items.isEmpty()) {
            return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUserId())
                .items(List.of())
                .totalAmount(BigDecimal.ZERO)
                .totalQuantity(0)
                .build();
        }

        List<Integer> prodIds = items.stream()
            .map(CartItem::getProdId)
            .distinct()
            .toList();

        Map<Integer, Product> productMap =
            productRepository.findByProdIdIn(prodIds)
                .stream()
                .collect(Collectors.toMap(Product::getProdId, p -> p));

        Map<Integer, String> thumbMap =
            cartFileQueryRepository.findProductThumbs(prodIds)
                .stream()
                .collect(Collectors.toMap(
                    CartFileQueryRepository.ProductThumbRow::getFileParentId,
                    CartFileQueryRepository.ProductThumbRow::getFilePath
                ));

        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalQty = 0;

        List<CartItemResponse> responses = new ArrayList<>();

        for (CartItem ci : items) {
            Product p = productMap.get(ci.getProdId());
            if (p == null) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            BigDecimal lineTotal =
                ci.getOrderPrice().multiply(BigDecimal.valueOf(ci.getOrderQuantity()));

            totalAmount = totalAmount.add(lineTotal);
            totalQty += ci.getOrderQuantity();

            responses.add(
                CartItemResponse.builder()
                    .cartItemId(ci.getCartItemId())
                    .prodId(p.getProdId())
                    .prodNm(p.getProdNm())
                    .orderPrice(ci.getOrderPrice())
                    .orderQuantity(ci.getOrderQuantity())
                    .lineTotal(lineTotal)
                    .thumbnailPath(thumbMap.get(p.getProdId()))
                    .build()
            );
        }

        return CartResponse.builder()
            .cartId(cart.getCartId())
            .userId(cart.getUserId())
            .items(responses)
            .totalAmount(totalAmount)
            .totalQuantity(totalQty)
            .build();
    }
}