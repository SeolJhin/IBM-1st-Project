package org.myweb.uniplace.domain.support.api.dto.response;

import lombok.Builder;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;

import java.time.LocalDateTime;

@Getter
@Builder
public class ComplainResponse {

    private Integer compId;
    private String compTitle;
    private String userId;
    private String compCtnt;
    private ComplainStatus compSt;
    private String code;
    private String fileCk;
    private String replyCk;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ComplainResponse from(Complain c) {
        return ComplainResponse.builder()
                .compId(c.getCompId())
                .compTitle(c.getCompTitle())
                .userId(c.getUserId())
                .compCtnt(c.getCompCtnt())
                .compSt(c.getCompSt())
                .code(c.getCode())
                .fileCk(c.getFileCk())
                .replyCk(c.getReplyCk())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}

