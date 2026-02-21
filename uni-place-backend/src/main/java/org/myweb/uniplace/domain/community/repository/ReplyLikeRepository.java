package org.myweb.uniplace.domain.community.repository;

import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.ReplyLike;
import org.myweb.uniplace.domain.community.domain.entity.ReplyLike.Id;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReplyLikeRepository extends JpaRepository<ReplyLike, Id> {

    long countByIdReplyId(Integer replyId);

    boolean existsByIdUserIdAndIdReplyId(String userId, Integer replyId);

    @Query("""
        select rl.id.replyId, count(rl)
          from ReplyLike rl
         where rl.id.replyId in :replyIds
         group by rl.id.replyId
    """)
    List<Object[]> countGroupByReplyIds(@Param("replyIds") List<Integer> replyIds);
}