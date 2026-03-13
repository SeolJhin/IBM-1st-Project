package org.myweb.uniplace.domain.inspection.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketStatusUpdateRequest {

    /** 변경할 상태 (open / in_progress / resolved / closed) */
    @NotBlank(message = "변경할 상태(ticketStatus)는 필수입니다.")
    private String ticketStatus;
}
