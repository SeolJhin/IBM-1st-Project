// 경로: org/myweb/uniplace/domain/review/repository/ReviewLikeRepository.java
package org.myweb.uniplace.domain.review.repository;

import org.myweb.uniplace.domain.review.domain.entity.ReviewLike;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewLikeRepository extends JpaRepository<ReviewLike, ReviewLike.Id> {

    long countByIdReviewId(Integer reviewId);

    boolean existsByIdUserIdAndIdReviewId(String userId, Integer reviewId);

    @Query("""
        select rl.id.reviewId, count(rl)
          from ReviewLike rl
         where rl.id.reviewId in :reviewIds
         group by rl.id.reviewId
    """)
    List<Object[]> countGroupByReviewIds(@Param("reviewIds") List<Integer> reviewIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ReviewLike rl where rl.id.reviewId = :reviewId")
    int deleteByReviewId(@Param("reviewId") Integer reviewId);
}
