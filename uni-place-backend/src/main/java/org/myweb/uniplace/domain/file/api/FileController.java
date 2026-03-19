package org.myweb.uniplace.domain.file.api;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.storage.StorageService;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;
    private final StorageService storageService;  // 로컬 or S3 자동 주입

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> upload(@ModelAttribute FileUploadRequest request) {
        return ApiResponse.ok(fileService.uploadFiles(request));
    }

    // ── 일반 조회 ────────────────────────────────────────────────────────────

    @GetMapping
    public ApiResponse<List<FileResponse>> list(
            @RequestParam("fileParentType") String parentType,
            @RequestParam("fileParentId") Integer parentId) {
        return ApiResponse.ok(fileService.getActiveFiles(parentType, parentId));
    }

    @GetMapping("/{fileId}")
    public ApiResponse<FileResponse> get(@PathVariable("fileId") Integer fileId) {
        return ApiResponse.ok(fileService.getFile(fileId));
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable("fileId") Integer fileId) throws Exception {
        FileResponse meta = fileService.getFile(fileId);
        return buildResponse(meta, ContentDisposition.attachment()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8).build());
    }

    @GetMapping("/{fileId}/view")
    public ResponseEntity<Resource> view(@PathVariable("fileId") Integer fileId) throws Exception {
        FileResponse meta = fileService.getFile(fileId);
        return buildResponse(meta, ContentDisposition.inline()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8).build());
    }

    // ── 삭제 ─────────────────────────────────────────────────────────────────

    @DeleteMapping
    public ApiResponse<Void> deleteByParent(
            @RequestParam("fileParentType") String parentType,
            @RequestParam("fileParentId") Integer parentId,
            @RequestBody(required = false) List<Integer> fileIds) {
        fileService.softDeleteFilesByParent(parentType, parentId,
                fileIds != null ? fileIds : List.of());
        return ApiResponse.ok();
    }

    @DeleteMapping("/admin")
    public ApiResponse<Void> deleteByIds(@RequestBody(required = false) List<Integer> fileIds) {
        fileService.softDeleteFiles(fileIds != null ? fileIds : List.of());
        return ApiResponse.ok();
    }

    // ── 관리자 조회 ──────────────────────────────────────────────────────────

    @GetMapping("/admin")
    public ApiResponse<List<FileResponse>> adminList(
            @RequestParam("fileParentType") String parentType,
            @RequestParam("fileParentId") Integer parentId) {
        return ApiResponse.ok(fileService.getAllFilesForAdmin(parentType, parentId));
    }

    @GetMapping("/admin/{fileId}")
    public ApiResponse<FileResponse> adminGet(@PathVariable("fileId") Integer fileId) {
        return ApiResponse.ok(fileService.getFileForAdmin(fileId));
    }

    @GetMapping("/admin/{fileId}/download")
    public ResponseEntity<Resource> adminDownload(@PathVariable("fileId") Integer fileId) throws Exception {
        FileResponse meta = fileService.getFileForAdmin(fileId);
        return buildResponse(meta, ContentDisposition.attachment()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8).build());
    }

    @GetMapping("/admin/{fileId}/view")
    public ResponseEntity<Resource> adminView(@PathVariable("fileId") Integer fileId) throws Exception {
        FileResponse meta = fileService.getFileForAdmin(fileId);
        return buildResponse(meta, ContentDisposition.inline()
                .filename(meta.getOriginFilename(), StandardCharsets.UTF_8).build());
    }

    // ── private ──────────────────────────────────────────────────────────────

    private ResponseEntity<Resource> buildResponse(FileResponse meta, ContentDisposition disposition)
            throws Exception {

        InputStream is = storageService.read(meta.getFilePath(), meta.getRenameFilename());
        InputStreamResource resource = new InputStreamResource(is);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(guessMediaType(meta.getFileType()));

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    private MediaType guessMediaType(String ext) {
        if (ext == null || ext.isBlank()) return MediaType.APPLICATION_OCTET_STREAM;
        String v = ext.trim().toLowerCase();
        if (v.startsWith(".")) v = v.substring(1);
        return switch (v) {
            case "png"        -> MediaType.IMAGE_PNG;
            case "jpg","jpeg" -> MediaType.IMAGE_JPEG;
            case "gif"        -> MediaType.IMAGE_GIF;
            case "webp"       -> MediaType.parseMediaType("image/webp");
            case "pdf"        -> MediaType.APPLICATION_PDF;
            case "txt"        -> MediaType.TEXT_PLAIN;
            default           -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}