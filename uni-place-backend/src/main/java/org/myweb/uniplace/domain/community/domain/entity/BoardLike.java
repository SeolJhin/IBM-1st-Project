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
@Table(name = "board_likes")
public class BoardLike {

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

        @Column(name = "board_id")
        private Integer boardId;
    }
}