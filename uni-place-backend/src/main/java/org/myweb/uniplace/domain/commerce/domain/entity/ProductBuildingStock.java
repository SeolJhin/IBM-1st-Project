package org.myweb.uniplace.domain.commerce.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "product_building_stock",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_prod_building", columnNames = {"prod_id", "building_id"})
    }
)
public class ProductBuildingStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stock_id")
    private Integer stockId;

    @Column(name = "prod_id", nullable = false)
    private Integer prodId;

    @Column(name = "building_id", nullable = false)
    private Integer buildingId;

    @Column(name = "stock", nullable = false)
    private Integer stock;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void decreaseStock(int qty) {
        if (this.stock < qty) {
            throw new BusinessException(ErrorCode.PRODUCT_OUT_OF_STOCK);
        }
        this.stock -= qty;
    }

    public void restoreStock(int qty) {
        this.stock += qty;
    }
}