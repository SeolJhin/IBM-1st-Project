package org.myweb.uniplace.domain.community.repository;

import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Integer> {

    List<Reply> findByBoardIdAndParentIdIsNullOrderByCreatedAtAscReplySeqAsc(Integer boardId);

    List<Reply> findByBoardIdAndParentIdOrderByCreatedAtAscReplySeqAsc(Integer boardId, Integer parentId);

    long countByBoardId(Integer boardId);

    // ✅ 관리자 삭제용: boardId에 속한 replyId들
    @Query("select r.replyId from Reply r where r.boardId = :boardId")
    List<Integer> findReplyIdsByBoardId(@Param("boardId") Integer boardId);

    // ✅ 관리자 삭제용: 게시글에 달린 댓글 전체 삭제
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Reply r where r.boardId = :boardId")
    int deleteByBoardId(@Param("boardId") Integer boardId);
}