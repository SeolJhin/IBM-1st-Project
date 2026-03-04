// 경로: org/myweb/uniplace/domain/review/domain/entity/ReviewLike.java
package org.myweb.uniplace.domain.review.domain.entity;

import java.io.Serializable;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "review_likes")
public class ReviewLike {

    @EmbeddedId
    private Id id;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    @Embeddable
    public static class Id implements Serializable {

        @Column(name = "user_id", length = 50)
        private String userId;

        @Column(name = "review_id")
        private Integer reviewId;
    }
}
