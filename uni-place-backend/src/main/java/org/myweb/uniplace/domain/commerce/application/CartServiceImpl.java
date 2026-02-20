// org/myweb/uniplace/domain/commerce/application/CartServiceImpl.java
package org.myweb.uniplace.domain.commerce.application;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.commerce.api.dto.request.*;
import org.myweb.uniplace.domain.commerce.api.dto.response.*;
import org.myweb.uniplace.domain.commerce.domain.entity.*;
import org.myweb.uniplace.domain.commerce.repository.*;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

// ⚠️ 실제 Product 경로에 맞춰 유지
import org.myweb.uniplace.domain.commerce.domain.entity.Product;
import org.myweb.uniplace.domain.commerce.repository.ProductRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private static final String FILE_PARENT_TYPE_PRODUCT = "product";

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CartFileQueryRepository cartFileQueryRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(String userId) {
        Cart cart = getOrCreateCart(userId);
        return buildResponse(cart);
    }

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
            cartItemRepository.findByCartIdAndProdId(cart.getCartId(), product.getProdId())
                .ifPresent(i -> i.increase(qty));
        }

        return buildResponse(cart);
    }

    @Override
    public CartResponse updateQuantity(String userId, Integer cartItemId, CartQuantityUpdateRequest request) {

        Cart cart = getOrCreateCart(userId);
        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST)); //BAD_REQUEST CART_ITEM_NOT_FOUND

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        item.changeQuantity(request.getQuantity());
        return buildResponse(cart);
    }

    @Override
    public CartResponse removeItem(String userId, Integer cartItemId) {

        Cart cart = getOrCreateCart(userId);
        CartItem item = cartItemRepository.findById(cartItemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST));

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        cartItemRepository.delete(item);
        return buildResponse(cart);
    }

    @Override
    public void clear(String userId) {
        Cart cart = getOrCreateCart(userId);
        cartItemRepository.deleteByCartId(cart.getCartId());
    }

    // ===================== private =====================

    private Cart getOrCreateCart(String userId) {
        return cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
            .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));
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

        List<Integer> prodIds = items.stream().map(CartItem::getProdId).distinct().toList();

        Map<Integer, Product> productMap = productRepository.findByProdIdIn(prodIds)  //product에 만들기
            .stream().collect(Collectors.toMap(Product::getProdId, p -> p));

        Map<Integer, String> thumbMap =
            cartFileQueryRepository.findLatestThumbs(FILE_PARENT_TYPE_PRODUCT, prodIds)
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
            if (p == null) throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);

            BigDecimal line = ci.getOrderPrice()
                .multiply(BigDecimal.valueOf(ci.getOrderQuantity()));

            totalAmount = totalAmount.add(line);
            totalQty += ci.getOrderQuantity();

            responses.add(
                CartItemResponse.builder()
                    .cartItemId(ci.getCartItemId())
                    .prodId(p.getProdId())
                    .prodNm(p.getProdNm())
                    .orderPrice(ci.getOrderPrice())
                    .orderQuantity(ci.getOrderQuantity())
                    .lineTotal(line)
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