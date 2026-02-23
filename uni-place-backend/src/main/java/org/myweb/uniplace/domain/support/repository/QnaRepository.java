package org.myweb.uniplace.domain.support.repository;

import org.myweb.uniplace.domain.support.domain.entity.Qna;
import org.myweb.uniplace.domain.support.domain.enums.QnaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QnaRepository extends JpaRepository<Qna, Integer> {

    /** 사용자 본인 질문 목록 검색 */
    @Query("""
            select q
            from Qna q
            where q.qnaLev = 0
              and (:userId is null or q.userId = :userId)
              and (:code is null or q.code = :code)
              and (:qnaSt is null or q.qnaSt = :qnaSt)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(q.qnaTitle) like lower(concat('%', :keyword, '%'))
                    or lower(q.qnaCtnt)  like lower(concat('%', :keyword, '%'))
                  )
            """)
    Page<Qna> search(
            @Param("userId") String userId,
            @Param("code") String code,
            @Param("qnaSt") QnaStatus qnaSt,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /** 관리자 전체 질문 목록 */
    @Query("""
            select q
            from Qna q
            where q.qnaLev = 0
              and (:code is null or q.code = :code)
              and (:qnaSt is null or q.qnaSt = :qnaSt)
              and (
                    :keyword is null
                    or :keyword = ''
                    or lower(q.qnaTitle) like lower(concat('%', :keyword, '%'))
                    or lower(q.qnaCtnt)  like lower(concat('%', :keyword, '%'))
                  )
            """)
    Page<Qna> searchAll(
            @Param("code") String code,
            @Param("qnaSt") QnaStatus qnaSt,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /** 특정 질문의 답변 목록 (qnaLev = 1) */
    List<Qna> findByParentIdOrderByQnaIdAsc(Integer parentId);

    /** 특정 질문의 답변 단건 조회 (관리자 수정용) */
    Optional<Qna> findByParentIdAndQnaLev(Integer parentId, Integer qnaLev);
}

