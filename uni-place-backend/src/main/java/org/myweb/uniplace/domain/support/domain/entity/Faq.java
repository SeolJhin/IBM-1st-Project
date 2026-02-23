package org.myweb.uniplace.domain.support.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "faq")
public class Faq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "faq_id")
    private Integer faqId;

    @Column(name = "faq_title", nullable = false, length = 100)
    private String faqTitle;

    @Column(name = "faq_ctnt", nullable = false, length = 3000)
    private String faqCtnt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** FAQ 상태 (1=활성, 0=비활성) */
    @Column(name = "is_active", nullable = false, columnDefinition = "INT DEFAULT 1")
    private Integer isActive;

    /** FK -> common_code(code) */
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @PrePersist
    public void prePersist() {
        if (isActive == null) isActive = 1;
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public void update(String faqTitle, String faqCtnt, String code) {
        if (faqTitle != null) this.faqTitle = faqTitle;
        if (faqCtnt != null) this.faqCtnt = faqCtnt;
        if (code != null) this.code = code;
    }

    public void changeActive(boolean active) {
        this.isActive = active ? 1 : 0;
    }
}

