package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;

@Getter
public class QnaStatusUpdateRequest {

    @NotNull
    private QnaStatus qnaSt;
}
