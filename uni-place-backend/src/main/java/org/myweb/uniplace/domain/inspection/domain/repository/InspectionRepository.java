package org.myweb.uniplace.domain.inspection.domain.repository;

import org.myweb.uniplace.domain.inspection.domain.entity.Inspection;
import org.myweb.uniplace.domain.inspection.domain.enums.InspectionSpaceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InspectionRepository extends JpaRepository<Inspection, Integer> {

    /**
     * 특정 공간의 가장 최근 점검 조회
     * → 이 레코드의 after_file_id가 다음 점검의 before_file_id가 됩니다.
     */
    Optional<Inspection> findTopBySpaceTypeAndSpaceIdOrderByCreatedAtDesc(
            InspectionSpaceType spaceType, Integer spaceId
    );

    /** 특정 공간의 점검 목록 (최신순 페이징) */
    Page<Inspection> findBySpaceTypeAndSpaceIdOrderByCreatedAtDesc(
            InspectionSpaceType spaceType, Integer spaceId, Pageable pageable
    );

    /** 전체 점검 목록 (최신순 페이징) */
    Page<Inspection> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
