// org/myweb/uniplace/domain/commerce/api/CartController.java
package org.myweb.uniplace.domain.commerce.api;

import org.myweb.uniplace.domain.commerce.api.dto.request.*;
import org.myweb.uniplace.domain.commerce.api.dto.response.CartResponse;
import org.myweb.uniplace.domain.commerce.application.CartService;

import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> myCart(@AuthenticationPrincipal AuthUser authUser) {
        return ApiResponse.ok(cartService.getMyCart(requireUserId(authUser)));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> add(
        @AuthenticationPrincipal AuthUser authUser,
        @RequestBody CartAddRequest request
    ) {
        return ApiResponse.ok(cartService.addItem(requireUserId(authUser), request));
    }

    @PatchMapping("/items/{cartItemId}")
    public ApiResponse<CartResponse> updateQuantity(
        @AuthenticationPrincipal AuthUser authUser,
        @PathVariable Integer cartItemId,
        @RequestBody CartQuantityUpdateRequest request
    ) {
        return ApiResponse.ok(cartService.updateQuantity(requireUserId(authUser), cartItemId, request));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ApiResponse<CartResponse> remove(
        @AuthenticationPrincipal AuthUser authUser,
        @PathVariable Integer cartItemId
    ) {
        return ApiResponse.ok(cartService.removeItem(requireUserId(authUser), cartItemId));
    }

    @DeleteMapping("/clear")
    public ApiResponse<Void> clear(@AuthenticationPrincipal AuthUser authUser) {
        cartService.clear(requireUserId(authUser));
        return ApiResponse.ok();
    }

    private String requireUserId(AuthUser authUser) {
        if (authUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return authUser.getUserId();
    }
}
