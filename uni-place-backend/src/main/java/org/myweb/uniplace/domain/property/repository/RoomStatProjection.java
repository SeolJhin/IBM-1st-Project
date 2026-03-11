// 경로: org/myweb/uniplace/domain/property/repository/RoomStatProjection.java
package org.myweb.uniplace.domain.property.repository;

/**
 * RoomRepository.findTopCandidateRooms() 네이티브 쿼리 결과 매핑용 Projection
 *
 * 컬럼 별칭(alias)이 getter 이름과 일치해야 Spring Data가 자동으로 매핑합니다.
 *   SQL alias: roomId    → getRoomId()
 *   SQL alias: avgRating → getAvgRating()
 *   SQL alias: reviewCount  → getReviewCount()
 *   SQL alias: contractCount → getContractCount()
 */
public interface RoomStatProjection {
    Integer getRoomId();
    Double  getAvgRating();
    Long    getReviewCount();
    Long    getContractCount();
}
