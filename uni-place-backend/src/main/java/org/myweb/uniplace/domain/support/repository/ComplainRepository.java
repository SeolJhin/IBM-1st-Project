package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Complain;
import org.myweb.uniplace.domain.support.domain.enums.ComplainImportance;
import org.myweb.uniplace.domain.support.domain.enums.ComplainStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplainRepository extends JpaRepository<Complain, Integer> {

    @Query("""
            select c
            from Complain c
            where (:userId is null or c.userId = :userId)
              and (:code is null or c.code = :code)
              and (:compSt is null or c.compSt = :compSt)
              and (:importance is null or c.importance = :importance)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(c.compTitle) like lower(concat('%', :keyword, '%'))
                    or lower(coalesce(c.compCtnt, '')) like lower(concat('%', :keyword, '%'))
                  )
            order by
              case
                when c.importance = org.myweb.uniplace.domain.support.domain.enums.ComplainImportance.high
                     and c.compSt <> org.myweb.uniplace.domain.support.domain.enums.ComplainStatus.resolved then 0
                when c.compSt = org.myweb.uniplace.domain.support.domain.enums.ComplainStatus.resolved then 2
                else 1
              end asc,
              c.createdAt desc
            """)
    Page<Complain> search(
            @Param("userId")     String userId,
            @Param("code")       String code,
            @Param("compSt")     ComplainStatus compSt,
            @Param("importance") ComplainImportance importance,
            @Param("keyword")    String keyword,
            Pageable pageable
    );

    Page<Complain> findByUserId(String userId, Pageable pageable);
}