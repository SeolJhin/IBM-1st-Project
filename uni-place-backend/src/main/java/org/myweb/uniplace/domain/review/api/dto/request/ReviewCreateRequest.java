// 경로: org/myweb/uniplace/domain/review/api/dto/request/ReviewCreateRequest.java
package org.myweb.uniplace.domain.review.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewCreateRequest {

    @NotNull(message = "roomId는 필수입니다.")
    private Integer roomId;

    /** 별점 1~5 */
    @NotNull(message = "rating은 필수입니다.")
    @Min(value = 1, message = "별점은 최소 1점입니다.")
    @Max(value = 5, message = "별점은 최대 5점입니다.")
    private Integer rating;

    @Size(max = 100, message = "제목은 100자 이내로 작성해 주세요.")
    private String reviewTitle;

    @Size(max = 3000, message = "내용은 3000자 이내로 작성해 주세요.")
    private String reviewCtnt;

    private String code;
}