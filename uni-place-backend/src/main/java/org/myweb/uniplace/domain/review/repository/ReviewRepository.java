// 경로: org/myweb/uniplace/domain/review/repository/ReviewRepository.java
package org.myweb.uniplace.domain.review.repository;

import java.util.List;

import org.myweb.uniplace.domain.review.domain.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    /** 방별 리뷰 목록 (최신순) */
    Page<Review> findByRoomIdOrderByReviewIdDesc(Integer roomId, Pageable pageable);

    /** 내 리뷰 목록 (최신순) */
    Page<Review> findByUserIdOrderByReviewIdDesc(String userId, Pageable pageable);

    /** 전체 리뷰 목록 (관리자, 최신순) */
    Page<Review> findAllByOrderByReviewIdDesc(Pageable pageable);

    /** 방별 평균 별점 */
    @Query("select coalesce(avg(r.rating), 0.0) from Review r where r.roomId = :roomId")
    double avgRatingByRoomId(@Param("roomId") Integer roomId);

    /** 방별 리뷰 수 */
    long countByRoomId(Integer roomId);

    /** 중복 작성 체크 */
    boolean existsByUserIdAndRoomId(String userId, Integer roomId);

    /** 조회수 1 증가 */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Review r set r.readCount = r.readCount + 1 where r.reviewId = :reviewId")
    void incrementReadCount(@Param("reviewId") int reviewId);

    /**
     * AI 챗봇용 필터 + 정렬 검색.
     * - roomId, buildingNm, minRating, maxRating 조건 지원
     * - Pageable 로 sort_by / sort_order / limit 제어
     */
    @Query("""
        select r from Review r
         join Room rm on rm.roomId = r.roomId
         join rm.building b
         where (:roomId     is null or r.roomId  = :roomId)
           and (:minRating  is null or r.rating >= :minRating)
           and (:maxRating  is null or r.rating <= :maxRating)
           and (:buildingNm is null or :buildingNm = ''
                or lower(b.buildingNm) like lower(concat('%', :buildingNm, '%')))
    """)
    Page<Review> searchWithFilters(
            @Param("roomId")     Integer roomId,
            @Param("minRating")  Integer minRating,
            @Param("maxRating")  Integer maxRating,
            @Param("buildingNm") String  buildingNm,
            Pageable pageable
    );
}