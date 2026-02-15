package org.myweb.uniplace.domain.file.application;

import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;

public interface FileService {

    FileUploadResponse uploadFiles(FileUploadRequest request);

    // ✅ 일반(조회시 삭제된 파일 제외)
    List<FileResponse> getActiveFiles(String parentType, Integer parentId);
    FileResponse getFile(Integer fileId);

    // ✅ 관리자(조회시 삭제된 파일 포함)
    List<FileResponse> getAllFilesForAdmin(String parentType, Integer parentId);
    FileResponse getFileForAdmin(Integer fileId);

    void softDeleteFiles(List<Integer> fileIds);
    void softDeleteFilesByParent(String parentType, Integer parentId, List<Integer> fileIds);
}