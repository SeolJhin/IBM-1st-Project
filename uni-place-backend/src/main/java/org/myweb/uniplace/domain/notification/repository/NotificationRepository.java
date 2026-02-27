// 경로: org/myweb/uniplace/domain/notification/repository/NotificationRepository.java
// ✅ 변경사항: deleteAllReadByReceiverId() JPQL 쿼리 추가
package org.myweb.uniplace.domain.notification.repository;

import org.myweb.uniplace.domain.notification.domain.entity.Notification;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(String receiverId, Pageable pageable);

    Page<Notification> findByReceiverIdAndIsReadOrderByCreatedAtDesc(String receiverId, String isRead, Pageable pageable);

    long countByReceiverIdAndIsRead(String receiverId, String isRead);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Notification n
           set n.isRead = 'Y',
               n.isReadAt = current_timestamp
         where n.receiverId = :receiverId
           and n.isRead = 'N'
    """)
    int markAllRead(@Param("receiverId") String receiverId);

    // ✅ 추가: 읽은 알림 전체 삭제
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        delete from Notification n
         where n.receiverId = :receiverId
           and n.isRead = 'Y'
    """)
    int deleteAllReadByReceiverId(@Param("receiverId") String receiverId);
}
