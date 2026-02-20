package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.common.ActivateEntity;
import org.myweb.uniplace.global.common.SoftDeleteEntity;

import java.math.BigDecimal;

/**
 * Product
 * - 상품 도메인 엔티티
 * - SoftDeleteEntity 상속: 논리삭제 지원
 * - ActivateEntity 상속 적용 가능: 활성/비활성 관리 필요 시
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "product")
public class Product extends SoftDeleteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prod_id")
    private Long prodId;

    @Column(name = "prod_name", nullable = false, length = 100, unique = true)
    private String prodName;

    @Column(name = "prod_desc", length = 500)
    private String prodDesc;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** 상품 상태 변경 메서드 */
    public void updateStatus(String status) {
        if (!"AVAILABLE".equals(status) && !"UNAVAILABLE".equals(status)) {
            throw new IllegalArgumentException("지원하지 않는 상태 값입니다.");
        }
        // 필요 시 isActive 또는 다른 필드 활용 가능
        // 예: AVAILABLE -> isActive=1, UNAVAILABLE -> isActive=0
    }

    /** 상품 수정 메서드 */
    public void update(String prodName, String prodDesc, BigDecimal price, Integer stock, String category, String imageUrl) {
        this.prodName = prodName;
        this.prodDesc = prodDesc;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.imageUrl = imageUrl;
    }
}