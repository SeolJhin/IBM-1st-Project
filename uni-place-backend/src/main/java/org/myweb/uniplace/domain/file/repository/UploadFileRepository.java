package org.myweb.uniplace.domain.file.repository;

import java.util.List;
import java.util.Optional;

import org.myweb.uniplace.domain.file.domain.entity.UploadFile;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UploadFileRepository extends JpaRepository<UploadFile, Integer> {

    // =========================
    // ✅ 일반(사용자) 조회: deleteYn = 'N' 조건을 "명시적으로" 건다
    // =========================

    List<UploadFile> findByFileParentTypeAndFileParentIdAndDeleteYnOrderBySortOrderAscFileIdAsc(
            String fileParentType,
            Integer fileParentId,
            String deleteYn
    );

    Optional<UploadFile> findByFileIdAndDeleteYn(Integer fileId, String deleteYn);

    // =========================
    // ✅ 관리자 조회: 삭제 포함(조건 없음)
    // - 기본 JpaRepository.findById() 사용 가능
    // - 목록도 필요하면 아래 메서드 사용
    // =========================

    List<UploadFile> findByFileParentTypeAndFileParentIdOrderBySortOrderAscFileIdAsc(
            String fileParentType,
            Integer fileParentId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update UploadFile f
           set f.sortOrder = :sortOrder
         where f.fileId = :fileId
           and f.fileParentType = :parentType
           and f.fileParentId = :parentId
    """)
    int updateSortOrder(
            @Param("fileId") Integer fileId,
            @Param("parentType") String parentType,
            @Param("parentId") Integer parentId,
            @Param("sortOrder") int sortOrder
    );

    // =========================
    // ✅ Soft Delete (기존 그대로)
    // =========================

    // ✅ 목록 조회 N+1 방지용: parentType + parentIds IN 쿼리
    @Query("""
        select f from UploadFile f
         where f.fileParentType = :parentType
           and f.fileParentId in :parentIds
           and f.deleteYn = 'N'
         order by f.sortOrder asc, f.fileId asc
    """)
    List<UploadFile> findActiveByParentTypeAndParentIds(
            @Param("parentType") String parentType,
            @Param("parentIds") List<Integer> parentIds
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update UploadFile f
           set f.deleteYn = 'Y'
         where f.fileId in :ids
           and f.fileParentType = :parentType
           and f.fileParentId = :parentId
    """)
    int softDeleteByIdsAndParent(
            @Param("ids") List<Integer> ids,
            @Param("parentType") String parentType,
            @Param("parentId") Integer parentId
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update UploadFile f
           set f.deleteYn = 'Y'
         where f.fileId in :ids
    """)
    int softDeleteByIds(@Param("ids") List<Integer> ids);
}