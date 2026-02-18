// 경로: org/myweb/uniplace/domain/file/api/dto/response/FileResponse.java
package org.myweb.uniplace.domain.file.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.file.domain.entity.UploadFile;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileResponse {

    private Integer fileId;
    private String fileParentType;
    private Integer fileParentId;
    private String filePath;
    private String originFilename;
    private String renameFilename;
    private Integer fileSize;
    private String fileType;
    private LocalDateTime createdAt;

    public static FileResponse fromEntity(UploadFile e) {
        return FileResponse.builder()
                .fileId(e.getFileId())
                .fileParentType(e.getFileParentType())
                .fileParentId(e.getFileParentId())
                .filePath(e.getFilePath())
                .originFilename(e.getOriginFilename())
                .renameFilename(e.getRenameFilename())
                .fileSize(e.getFileSize())
                .fileType(e.getFileType())
                .createdAt(e.getCreatedAt())
                .build();
    }
}