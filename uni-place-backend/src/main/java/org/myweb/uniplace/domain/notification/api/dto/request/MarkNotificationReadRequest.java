// 경로: org/myweb/uniplace/domain/notification/api/dto/request/MarkNotificationReadRequest.java
package org.myweb.uniplace.domain.notification.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class MarkNotificationReadRequest {

    @NotNull
    private Integer notificationId;
}