package org.myweb.uniplace.domain.support.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class QnaCreateRequest {

    @NotBlank
    @Size(max = 255)
    private String qnaTitle;

    @NotBlank
    @Size(max = 4000)
    private String qnaCtnt;

    @NotBlank
    @Size(max = 20)
    private String code;

    /** 답변 등록 시에만 사용 (질문 게시글 ID) */
    private Integer parentId;

    /** 질문-답변 묶음 아이디 */
    private Integer groupId;

    /** 계층 깊이 (0: 질문, 1: 답변) - 기본 0 */
    private Integer qnaLev;
}

