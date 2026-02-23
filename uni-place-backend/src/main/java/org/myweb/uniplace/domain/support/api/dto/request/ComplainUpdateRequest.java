package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;

@Getter
public class ComplainUpdateRequest {

    @Size(max = 300)
    private String compTitle;

    @Size(max = 3000)
    private String compCtnt;

    private ComplainStatus compSt;
}
