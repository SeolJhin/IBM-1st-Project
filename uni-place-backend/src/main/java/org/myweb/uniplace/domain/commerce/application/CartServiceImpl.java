// 경로: org/myweb/uniplace/domain/cart/application/CartServiceImpl.java
package org.myweb.uniplace.domain.commerce.application;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

import org.myweb.uniplace.domain.cart.api.dto.request.CartAddRequest;
import org.myweb.uniplace.domain.cart.api.dto.request.CartQuantityUpdateRequest;
import org.myweb.uniplace.domain.cart.api.dto.response.CartItemResponse;
import org.myweb.uniplace.domain.cart.api.dto.response.CartResponse;
import org.myweb.uniplace.domain.cart.domain.entity.Cart;
import org.myweb.uniplace.domain.cart.domain.entity.CartItem;
import org.myweb.uniplace.domain.cart.repository.CartFileQueryRepository;
import org.myweb.uniplace.domain.cart.repository.CartItemRepository;
import org.myweb.uniplace.domain.cart.repository.CartRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

// ✅ 너 프로젝트에 맞게 패키지만 조정
import org.myweb.uniplace.domain.product.domain.entity.Product;
import org.myweb.uniplace.domain.product.repository.ProductRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private static final String FILE_PARENT_TYPE_PRODUCT = "product";

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    private final ProductRepository productRepository;

    // ✅ files 벌크 조회 (최신 1개)
    private final CartFileQueryRepository cartFileQueryRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getMyCart(String userId) {
        Cart cart = cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));

        return buildCartResponse(cart);
    }

    @Override
    public CartResponse addItem(String userId, CartAddRequest request) {

        if (request == null || request.getProdId() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }

        int addQty = (request.getQuantity() == null ? 1 : request.getQuantity());
        if (addQty < 1) addQty = 1;

        Product product = productRepository.findById(request.getProdId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        Cart cart = cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
                .orElseGet(() -> cartRepository.save(Cart.builder().userId(userId).build()));

        BigDecimal unitPrice = nvl(product.getProdPrice());

        // ✅ 동시성: 유니크(uq_cart_item) 충돌 나면 흡수해서 update로 전환
        try {
            CartItem item = cartItemRepository.findByCartIdAndProdId(cart.getCartId(), product.getProdId())
                    .orElse(null);

            if (item == null) {
                cartItemRepository.save(CartItem.builder()
                        .cartId(cart.getCartId())
                        .prodId(product.getProdId())
                        .orderQuantity(addQty)
                        .orderPrice(unitPrice) // 카트 담는 시점 단가 스냅샷
                        .build());
            } else {
                item.increase(addQty);
                // 가격 정책: 카트 담긴 단가는 유지(스냅샷). 주문 시 최종확정은 주문에서.
                // 필요하면 여기서 최신 가격으로 갱신도 가능하지만, 실무에서는 보통 스냅샷 유지가 깔끔함.
            }
        } catch (DataIntegrityViolationException e) {
            // 동시에 insert 경쟁해서 유니크 충돌 -> 다시 조회 후 증가
            CartItem item = cartItemRepository.findByCartIdAndProdId(cart.getCartId(), product.getProdId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));
            item.increase(addQty);
        }

        return buildCartResponse(cart);
    }

    @Override
    public CartResponse updateQuantity(String userId, Integer cartItemId, CartQuantityUpdateRequest request) {

        Cart cart = cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        int qty = (request == null || request.getQuantity() == null) ? 1 : request.getQuantity();
        item.changeQuantity(qty);

        return buildCartResponse(cart);
    }

    @Override
    public CartResponse removeItem(String userId, Integer cartItemId) {

        Cart cart = cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!item.getCartId().equals(cart.getCartId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        cartItemRepository.delete(item);

        return buildCartResponse(cart);
    }

    @Override
    public void clear(String userId) {
        Cart cart = cartRepository.findTop1ByUserIdOrderByCartCreatedAtDesc(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_NOT_FOUND));

        cartItemRepository.deleteByCartId(cart.getCartId());
    }

    // ===== 응답 빌더 (N+1 제거 핵심) =====

    private CartResponse buildCartResponse(Cart cart) {

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
                .collect(Collectors.toList());

        // ✅ 상품 벌크 조회 (IN)
        List<Product> products = productRepository.findByProdIdIn(prodIds);
        Map<Integer, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getProdId, p -> p));

        // ✅ 썸네일 벌크 조회 (IN) - prodId당 최신 1개만
        Map<Integer, String> thumbMap = cartFileQueryRepository
                .findLatestThumbs(FILE_PARENT_TYPE_PRODUCT, prodIds)
                .stream()
                .collect(Collectors.toMap(
                        CartFileQueryRepository.ProductThumbRow::getFileParentId,
                        CartFileQueryRepository.ProductThumbRow::getFilePath,
                        (a, b) -> a // 혹시 중복이면 첫 값 유지
                ));

        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalQty = 0;

        List<CartItemResponse> res = new ArrayList<>();

        for (CartItem ci : items) {
            Product p = productMap.get(ci.getProdId());
            if (p == null) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            int qty = (ci.getOrderQuantity() == null ? 0 : ci.getOrderQuantity());
            BigDecimal unit = nvl(ci.getOrderPrice());
            BigDecimal line = unit.multiply(BigDecimal.valueOf(qty));

            totalAmount = totalAmount.add(line);
            totalQty += qty;

            res.add(CartItemResponse.builder()
                    .cartItemId(ci.getCartItemId())
                    .prodId(p.getProdId())
                    .prodNm(p.getProdNm())
                    .orderPrice(unit)
                    .thumbnailPath(thumbMap.get(p.getProdId())) // ✅ 단일 썸네일 1장
                    .orderQuantity(qty)
                    .lineTotal(line)
                    .build());
        }

        return CartResponse.builder()
                .cartId(cart.getCartId())
                .userId(cart.getUserId())
                .items(res)
                .totalAmount(totalAmount)
                .totalQuantity(totalQty)
                .build();
    }

    private BigDecimal nvl(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}