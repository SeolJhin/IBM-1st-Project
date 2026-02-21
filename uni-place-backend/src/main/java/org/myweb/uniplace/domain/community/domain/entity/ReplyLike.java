package org.myweb.uniplace.domain.community.domain.entity;

import java.io.Serializable;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reply_likes")
public class ReplyLike {

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

        @Column(name = "reply_id")
        private Integer replyId;
    }
}