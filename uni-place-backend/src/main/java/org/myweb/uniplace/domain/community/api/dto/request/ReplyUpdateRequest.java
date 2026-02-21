package org.myweb.uniplace.domain.community.api.dto.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyUpdateRequest {
    private String replyCtnt;
}