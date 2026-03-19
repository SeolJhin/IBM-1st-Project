package org.myweb.uniplace.domain.file.api.dto.response;

import java.time.LocalDateTime;

import org.myweb.uniplace.domain.file.domain.entity.UploadFile;
import org.myweb.uniplace.global.storage.StorageService;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileResponse {

    private Integer fileId;
    private String fileParentType;
    private Integer fileParentId;
    private String filePath;          // DB 상대경로 (변경 없음)
    private String originFilename;
    private String renameFilename;
    private Integer fileSize;
    private String fileType;
    private LocalDateTime createdAt;

    // 환경에 따라 로컬 URL or S3 URL
    private String viewUrl;
    private String downloadUrl;
    private String adminViewUrl;
    private String adminDownloadUrl;

    /**
     * StorageService 를 받아서 환경에 맞는 URL 생성
     * - 로컬: /files/{id}/view
     * - S3:   https://bucket.s3.region.amazonaws.com/ROOM/10/.../file.jpg
     */
    public static FileResponse fromEntity(UploadFile e, StorageService storage) {
        Integer id = e.getFileId();
        String relativeDir  = e.getFilePath();
        String renameFilename = e.getRenameFilename();

        String viewUrl     = storage.resolveViewUrl(id, relativeDir, renameFilename);
        String downloadUrl = storage.resolveDownloadUrl(id, relativeDir, renameFilename);

        // 어드민 URL: 로컬은 /files/admin/{id}/view, S3는 동일 URL 사용
        String adminViewUrl     = viewUrl.startsWith("http") ? viewUrl : "/files/admin/" + id + "/view";
        String adminDownloadUrl = downloadUrl.startsWith("http") ? downloadUrl : "/files/admin/" + id + "/download";

        return FileResponse.builder()
                .fileId(id)
                .fileParentType(e.getFileParentType())
                .fileParentId(e.getFileParentId())
                .filePath(relativeDir)
                .originFilename(e.getOriginFilename())
                .renameFilename(renameFilename)
                .fileSize(e.getFileSize())
                .fileType(e.getFileType())
                .createdAt(e.getCreatedAt())
                .viewUrl(viewUrl)
                .downloadUrl(downloadUrl)
                .adminViewUrl(adminViewUrl)
                .adminDownloadUrl(adminDownloadUrl)
                .build();
    }

    /**
     * StorageService 없이 호출하는 레거시 호환용
     * (테스트 코드 등에서 사용 시)
     */
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
                .viewUrl("/files/" + id + "/view")
                .downloadUrl("/files/" + id + "/download")
                .adminViewUrl("/files/admin/" + id + "/view")
                .adminDownloadUrl("/files/admin/" + id + "/download")
                .build();
    }
}