package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Notice;
import org.myweb.uniplace.domain.support.domain.enums.NoticeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Integer> {

    @Query("""
            select n
            from Notice n
            where (:noticeSt is null or n.noticeSt = :noticeSt)
              and (:code is null or n.code = :code)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(n.noticeTitle) like lower(concat('%', :keyword, '%'))
                    or lower(coalesce(n.noticeCtnt, '')) like lower(concat('%', :keyword, '%'))
                  )
            """)
    Page<Notice> search(
            @Param("noticeSt") NoticeStatus noticeSt,
            @Param("code") String code,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}

