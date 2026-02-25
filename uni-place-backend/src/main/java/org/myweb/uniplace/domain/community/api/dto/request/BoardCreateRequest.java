package org.myweb.uniplace.domain.community.api.dto.request;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardCreateRequest {

    private String boardTitle;
    private String boardCtnt;

    // FK: common_code.code
    private String code;

    // "Y"/"N"
    @Builder.Default
    private String anonymity = "N";

    @Builder.Default
    private String importance = "N";

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime impEndAt;
}