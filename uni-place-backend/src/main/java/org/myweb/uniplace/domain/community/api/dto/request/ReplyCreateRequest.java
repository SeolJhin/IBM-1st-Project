package org.myweb.uniplace.domain.community.api.dto.request;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyCreateRequest {
    private String replyCtnt;
}