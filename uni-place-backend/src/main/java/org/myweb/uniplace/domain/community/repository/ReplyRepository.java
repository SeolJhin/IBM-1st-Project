package org.myweb.uniplace.domain.community.repository;

import java.util.List;

import org.myweb.uniplace.domain.community.domain.entity.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReplyRepository extends JpaRepository<Reply, Integer> {

    List<Reply> findByBoardIdAndParentIdIsNullOrderByCreatedAtAscReplySeqAsc(Integer boardId);

    List<Reply> findByBoardIdAndParentIdOrderByCreatedAtAscReplySeqAsc(Integer boardId, Integer parentId);

    long countByBoardId(Integer boardId);
}