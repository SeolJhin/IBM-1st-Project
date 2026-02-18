// 경로: org/myweb/uniplace/domain/file/api/dto/response/FileUploadResponse.java
package org.myweb.uniplace.domain.file.api.dto.response;

import java.util.List;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {

    private Integer fileParentId;
    private String fileParentType;
    private List<FileResponse> files;
}