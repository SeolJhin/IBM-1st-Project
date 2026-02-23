package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Faq;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FaqRepository extends JpaRepository<Faq, Integer> {

    @Query("""
            select f
            from Faq f
            where (:code is null or f.code = :code)
              and (:isActive is null or f.isActive = :isActive)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(f.faqTitle) like lower(concat('%', :keyword, '%'))
                    or lower(f.faqCtnt)  like lower(concat('%', :keyword, '%'))
                  )
            """)
    Page<Faq> search(
            @Param("code") String code,
            @Param("isActive") Integer isActive,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}

