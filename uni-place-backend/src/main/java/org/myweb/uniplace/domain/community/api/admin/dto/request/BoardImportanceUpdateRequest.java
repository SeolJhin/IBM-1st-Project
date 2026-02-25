package org.myweb.uniplace.domain.community.api.admin.dto.request;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardImportanceUpdateRequest {

    // "Y"/"N"
    private String importance;

    // 중요 공지 종료 시간(없으면 null)
    private LocalDateTime impEndAt;
}