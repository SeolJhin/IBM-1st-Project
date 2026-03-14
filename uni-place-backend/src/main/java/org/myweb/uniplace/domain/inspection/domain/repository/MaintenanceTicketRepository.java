package org.myweb.uniplace.domain.inspection.domain.repository;

import org.myweb.uniplace.domain.inspection.domain.entity.MaintenanceTicket;
import org.myweb.uniplace.domain.inspection.domain.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Integer> {

    /** 특정 점검에서 생성된 티켓 목록 */
    List<MaintenanceTicket> findByInspectionId(Integer inspectionId);

    /** 처리 상태별 티켓 목록 (최신순 페이징) */
    Page<MaintenanceTicket> findByTicketStatusOrderByCreatedAtDesc(
            TicketStatus ticketStatus, Pageable pageable
    );

    /** 특정 상태를 제외한 티켓 목록 (최신순 페이징) - closed 제외하여 처리 중인 전체 조회 */
    Page<MaintenanceTicket> findByTicketStatusNotOrderByCreatedAtDesc(
            TicketStatus ticketStatus, Pageable pageable
    );
}