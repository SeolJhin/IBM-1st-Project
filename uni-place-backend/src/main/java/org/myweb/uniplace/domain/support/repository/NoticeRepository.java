package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Integer> {

    @Query(
        value = """
                SELECT *
                FROM notice n
                WHERE (:noticeSt IS NULL OR :noticeSt = '' OR n.notice_st = :noticeSt)
                  AND (:code     IS NULL OR :code     = '' OR n.code      = :code)
                  AND (
                        :keyword IS NULL OR :keyword = ''
                        OR LOWER(n.notice_title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(COALESCE(n.notice_ctnt, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      )
                ORDER BY n.importance DESC, n.notice_id DESC
                """,
        countQuery = """
                SELECT COUNT(*)
                FROM notice n
                WHERE (:noticeSt IS NULL OR :noticeSt = '' OR n.notice_st = :noticeSt)
                  AND (:code     IS NULL OR :code     = '' OR n.code      = :code)
                  AND (
                        :keyword IS NULL OR :keyword = ''
                        OR LOWER(n.notice_title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(COALESCE(n.notice_ctnt, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      )
                """,
        nativeQuery = true
    )
    Page<Notice> search(
            @Param("noticeSt") String noticeSt,
            @Param("code")     String code,
            @Param("keyword")  String keyword,
            Pageable pageable
    );
}