package org.myweb.uniplace.domain.contract.repository;

import java.time.LocalDate;
import java.util.Optional;

import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.contract.domain.enums.ContractStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ContractRepository extends JpaRepository<Contract, Integer> {

    boolean existsByContractIdAndUser_UserId(Integer contractId, String userId);

    @Query("""
        select c
          from Contract c
         where c.user.userId = :userId
         order by c.createdAt desc
    """)
    java.util.List<Contract> findMyContracts(@Param("userId") String userId);

    @Query("""
        select c
          from Contract c
          join fetch c.room r
          join fetch r.building b
         where c.user.userId = :userId
           and c.contractSt = :status
           and c.contractStart <= :today
           and c.contractEnd >= :today
         order by c.contractStart desc, c.contractId desc
    """)
    java.util.List<Contract> findActiveContractsWithRoomAndBuilding(
            @Param("userId") String userId,
            @Param("status") ContractStatus status,
            @Param("today") LocalDate today
    );

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

    @Query("""
        select count(c) > 0
          from Contract c
         where c.user.userId = :userId
           and c.contractSt in (:st1, :st2)
           and c.contractStart < :endDt
           and c.contractEnd   > :startDt
    """)
    boolean existsOverlappedContractByUser(
            @Param("userId") String userId,
            @Param("startDt") LocalDate startDt,
            @Param("endDt") LocalDate endDt,
            @Param("st1") ContractStatus st1,
            @Param("st2") ContractStatus st2
    );

    // ✅ 추가: room + building fetch join (계약서 이미지 생성 시 LAZY 로딩 문제 방지)
    @Query("""
        select c
          from Contract c
          join fetch c.room r
          join fetch r.building b
         where c.contractId = :contractId
    """)
    Optional<Contract> findWithRoomAndBuilding(@Param("contractId") Integer contractId);

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
                 or lower(c.lessorNm) like lower(concat('%', :keyword, '%'))
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
