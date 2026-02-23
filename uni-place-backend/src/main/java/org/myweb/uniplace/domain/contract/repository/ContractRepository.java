package org.myweb.uniplace.domain.contract.repository;

import java.time.LocalDate;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Integer> {

    // 기존: 내 계약 조회
    @Query("""
        select c
          from Contract c
         where c.user.userId = :userId
         order by c.createdAt desc
    """)
    java.util.List<Contract> findMyContracts(@Param("userId") String userId);

    // 기존: 기간 겹침 체크
    @Query("""
        select count(c) > 0
          from Contract c
         where c.room.roomId = :roomId
           and c.contractSt in (:st1, :st2)
           and c.contractStart < :endDt
           and c.contractEnd   > :startDt
    """)
    boolean existsOverlappedContract(
            @Param("roomId") Integer roomId,
            @Param("startDt") LocalDate startDt,
            @Param("endDt") LocalDate endDt,
            @Param("st1") ContractStatus st1,
            @Param("st2") ContractStatus st2
    );

    // ✅ 신규: 관리자 계약 목록(검색 + 페이징)
    @Query("""
        select c
          from Contract c
          join c.room r
          join r.building b
          join c.user u
         where
               (:status is null or c.contractSt = :status)
           and (:buildingId is null or b.buildingId = :buildingId)
           and (:roomNo is null or r.roomNo = :roomNo)
           and (:startFrom is null or c.contractStart >= :startFrom)
           and (:endTo is null or c.contractEnd <= :endTo)
           and (
                 :keyword is null or :keyword = ''
                 or lower(b.buildingNm) like lower(concat('%', :keyword, '%'))
                 or lower(c.lessorName) like lower(concat('%', :keyword, '%'))
                 or lower(u.userId) like lower(concat('%', :keyword, '%'))
               )
    """)
    Page<Contract> searchAdminPage(
            @Param("keyword") String keyword,
            @Param("status") ContractStatus status,
            @Param("buildingId") Integer buildingId,
            @Param("roomNo") Integer roomNo,
            @Param("startFrom") LocalDate startFrom,
            @Param("endTo") LocalDate endTo,
            Pageable pageable
    );
}