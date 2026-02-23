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

    /** readCount 증가 (Review 테이블에 read_count 없으므로 불필요 — 게시판형 요청에 맞게 추가 가능)
     *  현재 reviews 스키마엔 read_count 컬럼이 없어 생략
     */
}