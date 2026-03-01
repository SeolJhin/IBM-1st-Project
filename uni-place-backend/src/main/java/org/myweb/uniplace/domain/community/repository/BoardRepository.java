// 경로: org/myweb/uniplace/domain/community/repository/BoardRepository.java
package org.myweb.uniplace.domain.community.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardRepository extends JpaRepository<Board, Integer> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Board b set b.readCount = b.readCount + 1 where b.boardId = :boardId")
    int incrementReadCount(@Param("boardId") Integer boardId);

    /**
     * ✅ 중요글(importance='Y' + 기간 유효) 상단 고정
     * - 유효 조건: impEndAt IS NULL OR impEndAt >= now
     * - 정렬: (유효 중요글 먼저) -> 최신(boardId desc)
     */
    @Query("""
        select b
          from Board b
         order by
              case
                when b.importance = 'Y' and (b.impEndAt is null or b.impEndAt >= :now) then 0
                else 1
              end asc,
              b.boardId desc
    """)
    Page<Board> findBoardListOrdered(@Param("now") LocalDateTime now, Pageable pageable);
    
 // BoardRepository.java에 추가
    @Query("""
        select b
          from Board b
         where b.createdAt >= :from
         order by b.readCount desc, b.boardId desc
    """)
    List<Board> findWeeklyTop(@Param("from") LocalDateTime from, Pageable pageable);

    @Query("""
        select b
          from Board b
         where b.code = :code
         order by b.boardId desc
    """)
    Page<Board> findByCodeOrderByBoardIdDesc(@Param("code") String code, Pageable pageable);
    
    @Query("""
    	    select b from Board b
    	     where b.userId = :userId
    	     order by b.boardId desc
    	""")
    	Page<Board> findByUserIdOrderByBoardIdDesc(@Param("userId") String userId, Pageable pageable);

    	@Query("""
    	    select b from Board b
    	     where b.userId = :userId
    	       and b.code = :code
    	     order by b.boardId desc
    	""")
    	Page<Board> findByUserIdAndCodeOrderByBoardIdDesc(@Param("userId") String userId, @Param("code") String code, Pageable pageable);
}
