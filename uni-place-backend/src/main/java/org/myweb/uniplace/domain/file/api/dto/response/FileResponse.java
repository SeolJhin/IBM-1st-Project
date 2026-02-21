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

    // 추가: 프론트에서 바로 쓸 미리보기/다운로드 URL
    private String viewUrl;        // /files/{fileId}/view
    private String downloadUrl;    // /files/{fileId}/download

    // (선택) 관리자용도 같이 제공(원치 않으면 제거 가능)
    private String adminViewUrl;       // /files/admin/{fileId}/view
    private String adminDownloadUrl;   // /files/admin/{fileId}/download

    public static FileResponse fromEntity(UploadFile e) {
        Integer id = e.getFileId();

        return FileResponse.builder()
                .fileId(id)
                .fileParentType(e.getFileParentType())
                .fileParentId(e.getFileParentId())
                .filePath(e.getFilePath())
                .originFilename(e.getOriginFilename())
                .renameFilename(e.getRenameFilename())
                .fileSize(e.getFileSize())
                .fileType(e.getFileType())
                .createdAt(e.getCreatedAt())

                // ✅ URL은 DB 컬럼이 아니라 “응답에서 계산”하는 값
                .viewUrl("/files/" + id + "/view")
                .downloadUrl("/files/" + id + "/download")
                .adminViewUrl("/files/admin/" + id + "/view")
                .adminDownloadUrl("/files/admin/" + id + "/download")
                .build();
    }
}