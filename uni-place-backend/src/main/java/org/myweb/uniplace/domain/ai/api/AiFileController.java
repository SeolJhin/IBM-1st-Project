package org.myweb.uniplace.domain.ai.api;

import java.util.List;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/v1/ai/files")
@RequiredArgsConstructor
public class AiFileController {

    private final FileService fileService;

    @Value("${ai.internal.token:}")
    private String internalToken;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileUploadResponse>> upload(
        @RequestHeader(value = "X-Internal-Token", required = false) String callerToken,
        @RequestParam("fileParentType") String fileParentType,
        @RequestParam("fileParentId") Integer fileParentId,
        @RequestParam("files") List<MultipartFile> files
    ) {
        if (!StringUtils.hasText(internalToken)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI internal token is not configured");
        }
        if (!internalToken.equals(callerToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized internal caller");
        }

        FileUploadRequest request = FileUploadRequest.builder()
            .fileParentType(fileParentType)
            .fileParentId(fileParentId)
            .files(files)
            .build();

        FileUploadResponse response = fileService.uploadFiles(request);
        log.info("[AiFileController] uploaded parentType={} parentId={} count={}",
            fileParentType, fileParentId, response.getFiles() == null ? 0 : response.getFiles().size());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}

