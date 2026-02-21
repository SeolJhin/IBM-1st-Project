package org.myweb.uniplace.domain.community.api.dto.request;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardUpdateRequest {

    private String boardTitle;
    private String boardCtnt;
    private String code;

    // "Y"/"N"
    private String anonymity;
    private String importance;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime impEndAt;
}