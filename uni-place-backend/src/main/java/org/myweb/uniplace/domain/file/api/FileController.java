package org.myweb.uniplace.domain.file.api;

import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;

    @Value("${file.upload-path}")
    private String uploadBasePath;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> upload(@Validated @ModelAttribute FileUploadRequest request) {
        return ApiResponse.ok(fileService.uploadFiles(request));
    }

    // =========================
    // 일반(삭제 제외) API
    // =========================

    @GetMapping
    public ApiResponse<List<FileResponse>> list(
            @RequestParam("parentType") String parentType,
            @RequestParam("parentId") Integer parentId
    ) {
        return ApiResponse.ok(fileService.getActiveFiles(parentType, parentId));
    }

    @GetMapping("/{fileId}")
    public ApiResponse<FileResponse> get(@PathVariable("fileId") Integer fileId) {
        return ApiResponse.ok(fileService.getFile(fileId));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable("fileId") Integer fileId) throws Exception {

        FileResponse meta = fileService.getFile(fileId);

        Path absPath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(absPath) || !Files.isRegularFile(absPath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(absPath.toUri());

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @GetMapping("/{fileId}/view")
    public ResponseEntity<Resource> view(@PathVariable("fileId") Integer fileId) throws Exception {

        FileResponse meta = fileService.getFile(fileId);

        Path absPath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(absPath) || !Files.isRegularFile(absPath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(absPath.toUri());

        MediaType mediaType = guessMediaType(meta.getFileType());

        ContentDisposition disposition = ContentDisposition.inline()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(mediaType);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @DeleteMapping
    public ApiResponse<Void> deleteByParent(
            @RequestParam("parentType") String parentType,
            @RequestParam("parentId") Integer parentId,
            @RequestBody List<Integer> fileIds
    ) {
        fileService.softDeleteFilesByParent(parentType, parentId, fileIds);
        return ApiResponse.ok();
    }

    @DeleteMapping("/admin")
    public ApiResponse<Void> deleteByIds(@RequestBody List<Integer> fileIds) {
        fileService.softDeleteFiles(fileIds);
        return ApiResponse.ok();
    }

    // =========================
    // 관리자(삭제 포함) 조회 API
    // =========================

    @GetMapping("/admin")
    public ApiResponse<List<FileResponse>> adminList(
            @RequestParam("parentType") String parentType,
            @RequestParam("parentId") Integer parentId
    ) {
        return ApiResponse.ok(fileService.getAllFilesForAdmin(parentType, parentId));
    }

    @GetMapping("/admin/{fileId}")
    public ApiResponse<FileResponse> adminGet(@PathVariable("fileId") Integer fileId) {
        return ApiResponse.ok(fileService.getFileForAdmin(fileId));
    }

    @GetMapping("/admin/{fileId}/download")
    public ResponseEntity<Resource> adminDownload(@PathVariable("fileId") Integer fileId) throws Exception {

        FileResponse meta = fileService.getFileForAdmin(fileId);

        Path absPath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(absPath) || !Files.isRegularFile(absPath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(absPath.toUri());

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @GetMapping("/admin/{fileId}/view")
    public ResponseEntity<Resource> adminView(@PathVariable("fileId") Integer fileId) throws Exception {

        FileResponse meta = fileService.getFileForAdmin(fileId);

        Path absPath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(absPath) || !Files.isRegularFile(absPath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(absPath.toUri());

        MediaType mediaType = guessMediaType(meta.getFileType());

        ContentDisposition disposition = ContentDisposition.inline()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(mediaType);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    private MediaType guessMediaType(String fileTypeOrExt) {
        if (fileTypeOrExt == null || fileTypeOrExt.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }

        String v = fileTypeOrExt.trim().toLowerCase();

        // MIME 형태 들어오는 경우도 처리
        if (v.startsWith("image/")) return MediaType.parseMediaType(v);
        if (v.equals("application/pdf")) return MediaType.APPLICATION_PDF;
        if (v.equals("text/plain")) return MediaType.TEXT_PLAIN;

        // 확장자 형태 처리 (".png" / "png" 둘 다)
        if (v.startsWith(".")) v = v.substring(1);

        return switch (v) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "webp" -> MediaType.parseMediaType("image/webp");
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "txt" -> MediaType.TEXT_PLAIN;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}