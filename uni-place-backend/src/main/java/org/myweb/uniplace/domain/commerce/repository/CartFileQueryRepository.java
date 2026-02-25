package org.myweb.uniplace.domain.commerce.repository;

import java.util.List;

import org.myweb.uniplace.domain.file.domain.entity.UploadFile;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface CartFileQueryRepository extends Repository<UploadFile, Integer> {

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
                 where file_parent_type = 'product'
                   and delete_yn = 'N'
                   and file_parent_id in :productIds
                 group by file_parent_id
          ) x
            on x.file_parent_id = f.file_parent_id
           and x.min_file_id    = f.file_id
         where f.file_parent_id in :productIds
           and f.delete_yn = 'N'
    """, nativeQuery = true)
    List<ProductThumbRow> findProductThumbs(
            @Param("productIds") List<Integer> productIds
    );
}