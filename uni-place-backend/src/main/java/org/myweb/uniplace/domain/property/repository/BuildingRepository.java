// 경로: org/myweb/uniplace/domain/property/repository/BuildingRepository.java
package org.myweb.uniplace.domain.property.repository;

import java.util.List;
import java.util.Optional;

import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Integer> {

    // ✅ 단건 조회 - 삭제되지 않은 건물만 (일반 사용자용)
    Optional<Building> findByBuildingIdAndDeleteYn(Integer buildingId, String deleteYn);

    // ✅ 목록 조회 - 삭제되지 않은 건물 페이징 (일반 사용자용)
    Page<Building> findAllByDeleteYn(String deleteYn, Pageable pageable);

    // ✅ 이름 검색 - 삭제되지 않은 건물만 (RoomService.resolveBuildingByName 에서 사용)
    List<Building> findByBuildingNmAndDeleteYn(String buildingNm, String deleteYn);

    // ✅ AI 챗봇용 필터 검색 - 엘리베이터, 주차, 이름/주소 키워드 등 조건 지원
    @Query("""
        select b from Building b
         where b.deleteYn = 'N'
           and (:existElv  is null or b.existElv = :existElv)
           and (:minParking is null or b.parkingCapacity >= :minParking)
           and (:keyword   is null or :keyword = ''
                or lower(b.buildingNm)   like lower(concat('%', :keyword, '%'))
                or lower(b.buildingAddr) like lower(concat('%', :keyword, '%')))
    """)
    Page<Building> searchWithFilters(
            @Param("existElv")   String existElv,
            @Param("minParking") Integer minParking,
            @Param("keyword")    String keyword,
            Pageable pageable
    );
}