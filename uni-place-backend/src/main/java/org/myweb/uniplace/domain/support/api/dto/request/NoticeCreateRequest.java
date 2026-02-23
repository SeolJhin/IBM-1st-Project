package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import org.myweb.uniplace.domain.support.domain.enums.NoticeStatus;

import java.time.LocalDateTime;

@Getter
public class NoticeCreateRequest {

    @NotBlank
    @Size(max = 100)
    private String noticeTitle;

    @Size(max = 3000)
    private String noticeCtnt;

    private String importance;

    private LocalDateTime impEndAt;

    @NotNull
    private NoticeStatus noticeSt;

    @NotBlank
    @Size(max = 20)
    private String code;
}

