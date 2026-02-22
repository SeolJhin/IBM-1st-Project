package org.myweb.uniplace.domain.commerce.domain.enums;

/**
 * product.prod_st ENUM 값과 정확히 일치
 * ENUM('on_sale','sold_out')
 */
public enum ProductStatus {
    on_sale,    // ✅ Fix: ON_SALE → on_sale
    sold_out    // ✅ Fix: SOLD_OUT → sold_out
}
