package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplainRepository extends JpaRepository<Complain, Integer> {

    /** 관리자 전체 목록 검색 — 중요도 높은 순(high→medium→low→null) 후 최신순 */
    @Query("""
            select c
            from Complain c
            where (:userId is null or c.userId = :userId)
              and (:code is null or c.code = :code)
              and (:compSt is null or c.compSt = :compSt)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(c.compTitle) like lower(concat('%', :keyword, '%'))
                    or lower(coalesce(c.compCtnt, '')) like lower(concat('%', :keyword, '%'))
                  )
            order by
              case c.importance
                when 'high'   then 1
                when 'medium' then 2
                when 'low'    then 3
                else               4
              end asc,
              c.createdAt desc
            """)
    Page<Complain> search(
            @Param("userId") String userId,
            @Param("code") String code,
            @Param("compSt") ComplainStatus compSt,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /** 본인 민원 목록 */
    Page<Complain> findByUserId(String userId, Pageable pageable);
}