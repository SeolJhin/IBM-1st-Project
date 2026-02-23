package org.myweb.uniplace.domain.support.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.entity.Faq;

import java.time.LocalDateTime;

@Getter
@Builder
public class FaqResponse {

    private Integer faqId;
    private String faqTitle;
    private String faqCtnt;
    private LocalDateTime createdAt;
    private Integer isActive;
    private String code;

    public static FaqResponse from(Faq f) {
        return FaqResponse.builder()
                .faqId(f.getFaqId())
                .faqTitle(f.getFaqTitle())
                .faqCtnt(f.getFaqCtnt())
                .createdAt(f.getCreatedAt())
                .isActive(f.getIsActive())
                .code(f.getCode())
                .build();
    }
}

