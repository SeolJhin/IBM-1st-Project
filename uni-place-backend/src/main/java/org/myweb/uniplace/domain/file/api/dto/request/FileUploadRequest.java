// 경로: org/myweb/uniplace/domain/file/api/dto/request/FileUploadRequest.java
package org.myweb.uniplace.domain.file.api.dto.request;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadRequest {

    @NotBlank(message = "fileParentType은 필수입니다.")
    private String fileParentType;

    @NotNull(message = "fileParentId는 필수입니다.")
    private Integer fileParentId;

    private List<MultipartFile> files;
}