package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;

import org.myweb.uniplace.domain.file.domain.entity.UploadFile; // ✅ 네 프로젝트 File 엔티티 경로로 수정
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface CartFileQueryRepository extends Repository<UploadFile, Long> { // ✅ Object 금지, ID 타입도 File PK에 맞춤

    interface ProductThumbRow {
        Integer getFileParentId();
        String getFilePath();
    }

    @Query(value = """
        select f.file_parent_id as fileParentId,
               f.file_path      as filePath
          from files f
          join (
                select file_parent_id, min(file_id) as min_file_id
                  from files
                 where file_ref_type = 'PRODUCT'   -- 예시
                 group by file_parent_id
          ) x
            on x.file_parent_id = f.file_parent_id
           and x.min_file_id    = f.file_id
         where f.file_parent_id in :productIds
    """, nativeQuery = true)
    List<ProductThumbRow> findProductThumbs(@Param("productIds") List<Integer> productIds);
}