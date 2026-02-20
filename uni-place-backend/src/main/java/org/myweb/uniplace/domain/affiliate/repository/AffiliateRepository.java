package org.myweb.uniplace.domain.affiliate.repository;

import org.myweb.uniplace.domain.affiliate.domain.entity.Affiliate;
import org.myweb.uniplace.domain.affiliate.domain.enums.AffiliateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AffiliateRepository extends JpaRepository<Affiliate, Integer> {

    @Query("""
            select a
            from Affiliate a
            where (:buildingId is null or a.buildingId = :buildingId)
              and (:code is null or a.code = :code)
              and (:affiliateSt is null or a.affiliateSt = :affiliateSt)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(a.affiliateNm) like lower(concat('%', :keyword, '%'))
                    or lower(coalesce(a.affiliateCeo, '')) like lower(concat('%', :keyword, '%'))
                    or lower(coalesce(a.affiliateTel, '')) like lower(concat('%', :keyword, '%'))
                  )
            """)
    Page<Affiliate> search(
            @Param("buildingId") Integer buildingId,
            @Param("code") String code,
            @Param("keyword") String keyword,
            @Param("affiliateSt") AffiliateStatus affiliateSt,
            Pageable pageable
    );

    boolean existsByBuildingIdAndAffiliateNmIgnoreCase(Integer buildingId, String affiliateNm);
}
