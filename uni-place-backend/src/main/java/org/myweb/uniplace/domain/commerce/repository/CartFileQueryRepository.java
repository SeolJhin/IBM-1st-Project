// 경로: org/myweb/uniplace/domain/cart/repository/CartFileQueryRepository.java
package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface CartFileQueryRepository extends Repository<Object, Integer> {

    interface ProductThumbRow {
        Integer getFileParentId();   // file_parent_id
        String getFilePath();        // file_path
    }

    /**
     *
     * - parent_id(=prod_id) 별 최신 1개를 created_at DESC, file_id DESC 기준으로 확정
     * - created_at 동률이어도 file_id로 타이브레이크해서 항상 1개만 반환
     */
    @Query(value = """
        select x.file_parent_id as fileParentId,
               x.file_path      as filePath
          from (
                select f.file_parent_id,
                       f.file_path,
                       row_number() over (
                         partition by f.file_parent_id
                         order by f.created_at desc, f.file_id desc
                       ) as rn
                  from files f
                 where f.file_parent_type = :parentType
                   and f.file_parent_id in (:parentIds)
                   and f.delete_yn = 'N'
          ) x
         where x.rn = 1
        """, nativeQuery = true)
    List<ProductThumbRow> findLatestThumbs(
            @Param("parentType") String parentType,
            @Param("parentIds") List<Integer> parentIds
    );
}