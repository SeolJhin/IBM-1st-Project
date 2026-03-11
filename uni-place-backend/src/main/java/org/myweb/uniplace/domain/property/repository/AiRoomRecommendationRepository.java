// 경로: org/myweb/uniplace/domain/property/repository/AiRoomRecommendationRepository.java
package org.myweb.uniplace.domain.property.repository;

import java.util.List;

import org.myweb.uniplace.domain.property.domain.entity.AiRoomRecommendation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AiRoomRecommendationRepository
        extends JpaRepository<AiRoomRecommendation, Integer> {

    /**
     * 가장 최근에 생성된 추천 결과 Top3 를 순위 오름차순으로 조회
     * - generated_at 이 가장 큰(= 최신) 배치에서 rank_no 1→2→3 순서로 반환
     */
    @Query("""
        select a
          from AiRoomRecommendation a
         where a.generatedAt = (
               select max(a2.generatedAt)
                 from AiRoomRecommendation a2
               )
         order by a.rankNo asc
    """)
    List<AiRoomRecommendation> findLatestTop3();
}
