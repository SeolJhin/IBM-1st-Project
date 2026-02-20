// Controller
// 경로: org/myweb/uniplace/domain/commerce/api/CartController.java
package org.myweb.uniplace.domain.commerce.api;

import org.myweb.uniplace.domain.commerce.api.dto.request.CartAddRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.CartUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.CartResponse;
import org.myweb.uniplace.domain.commerce.application.CartService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    /**
     * ✅ 장바구니 추가
     * POST /cart
     * - 실서비스에선 userId를 토큰에서 꺼내는 게 정석
     * - 현재는 요청 헤더로 userId를 받는 방식(프로젝트 방식에 맞게 교체)
     */
    @PostMapping
    public ApiResponse<CartResponse> add(
            @RequestHeader("X-USER-ID") String userId,
            @Valid @RequestBody CartAddRequest request
    ) {
        return ApiResponse.ok(cartService.addItem(userId, request));
    }

    /**
     * ✅ 내 장바구니 조회
     * GET /cart/me
     */
    @GetMapping("/me")
    public ApiResponse<CartResponse> me(
            @RequestHeader("X-USER-ID") String userId
    ) {
        return ApiResponse.ok(cartService.getMyCart(userId));
    }

    /**
     * ✅ 수량 변경
     * PATCH /cart/{cart_num}
     * - 스펙 문서의 cart_num은 cart_item_id로 매핑
     */
    @PatchMapping("/{cart_num}")
    public ApiResponse<CartResponse> updateQty(
            @RequestHeader("X-USER-ID") String userId,
            @PathVariable(name = "cart_num") Integer cartItemId,
            @Valid @RequestBody CartUpdateRequest request
    ) {
        return ApiResponse.ok(cartService.updateQuantity(userId, cartItemId, request));
    }

    /**
     * ✅ 장바구니 항목 삭제
     * DELETE /cart/{cart_num}
     */
    @DeleteMapping("/{cart_num}")
    public ApiResponse<Void> deleteItem(
            @RequestHeader("X-USER-ID") String userId,
            @PathVariable(name = "cart_num") Integer cartItemId
    ) {
        cartService.deleteItem(userId, cartItemId);
        return ApiResponse.ok();
    }

    /**
     * ✅ 장바구니 비우기(선택)
     * DELETE /cart/me
     */
    @DeleteMapping("/me")
    public ApiResponse<Void> clear(
            @RequestHeader("X-USER-ID") String userId
    ) {
        cartService.clearMyCart(userId);
        return ApiResponse.ok();
    }
}