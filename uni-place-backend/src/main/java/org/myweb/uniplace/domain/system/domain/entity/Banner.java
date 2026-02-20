package org.myweb.uniplace.domain.system.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.system.domain.enums.BannerStatus;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "banner")
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ban_id")
    private Integer banId;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(name = "ban_title", nullable = false, length = 100)
    private String banTitle;

    @Column(name = "ban_url", length = 200)
    private String banUrl;

    @Column(name = "ban_order", nullable = false)
    private Integer banOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "ban_st", nullable = false, length = 20)
    private BannerStatus banSt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (banSt == null) banSt = BannerStatus.active; // DB default도 active :contentReference[oaicite:8]{index=8}
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(
            LocalDateTime startAt,
            LocalDateTime endAt,
            String banTitle,
            String banUrl,
            Integer banOrder,
            BannerStatus banSt
    ) {
        if (startAt != null) this.startAt = startAt;
        if (endAt != null) this.endAt = endAt;
        if (banTitle != null) this.banTitle = banTitle;
        if (banUrl != null) this.banUrl = banUrl;
        if (banOrder != null) this.banOrder = banOrder;
        if (banSt != null) this.banSt = banSt;
    }
    
    public void changeStatus(BannerStatus banSt) {
        if (banSt != null) this.banSt = banSt;
    }

    public void changeOrder(Integer banOrder) {
        if (banOrder != null) this.banOrder = banOrder;
    }
    
    public void clearUrl() {
        this.banUrl = null;
    }
}