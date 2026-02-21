package org.myweb.uniplace.domain.community.repository;

import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.BoardLike;
import org.myweb.uniplace.domain.community.domain.entity.BoardLike.Id;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, Id> {

    long countByIdBoardId(Integer boardId);

    boolean existsByIdUserIdAndIdBoardId(String userId, Integer boardId);

    @Query("""
        select bl.id.boardId, count(bl)
          from BoardLike bl
         where bl.id.boardId in :boardIds
         group by bl.id.boardId
    """)
    List<Object[]> countGroupByBoardIds(@Param("boardIds") List<Integer> boardIds);
}