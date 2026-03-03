package org.myweb.uniplace.domain.community.api.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyCreateRequest {
    private String replyCtnt;
    private String anonymity; // "Y" or "N"
}