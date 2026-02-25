package org.myweb.uniplace.domain.commerce.api.admin;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.application.ProductService;
import org.myweb.uniplace.domain.commerce.domain.enums.ProductStatus;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.util.List;

/**
 * 관리자용 Product Controller
 * - 상품 CRUD + 상품 이미지 관리
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/products")
public class AdminProductController {

    private static final String PARENT_TYPE_PRODUCT = "PRODUCT";

    private final ProductService productService;
    private final FileService fileService;

    // 상품 생성 → 생성된 ID 반환
    @PostMapping
    public ApiResponse<Integer> create(@RequestBody @Valid ProductCreateRequest request) {
        return ApiResponse.ok(productService.createProduct(request).getProdId());
    }

    // 상품 수정
    @PutMapping("/{prodId}")
    public ApiResponse<Void> update(
            @PathVariable("prodId") Integer prodId,                 // ✅ 이름 명시
            @RequestBody @Valid ProductUpdateRequest request
    ) {
        productService.updateProduct(prodId, request);
        return ApiResponse.ok();
    }

    // 상품 상태 변경
    @PatchMapping("/{prodId}/status")
    public ApiResponse<Void> changeStatus(
            @PathVariable("prodId") Integer prodId,                 // ✅ 이름 명시
            @RequestBody ProductStatus status
    ) {
        productService.changeStatus(prodId, status);
        return ApiResponse.ok();
    }

    // 상품 삭제
    @DeleteMapping("/{prodId}")
    public ApiResponse<Void> delete(@PathVariable("prodId") Integer prodId) { // ✅ 이름 명시
        productService.deleteProduct(prodId);
        return ApiResponse.ok();
    }

    // =========================
    // ✅ 상품 이미지 관리 (files 구조 그대로 활용)
    // =========================

    // ✅ 이미지 목록(관리자도 삭제 제외로 보여줌)
    @GetMapping("/{prodId}/images")
    public ApiResponse<List<FileResponse>> images(@PathVariable("prodId") Integer prodId) {
        productService.getProduct(prodId);
        return ApiResponse.ok(fileService.getActiveFiles(PARENT_TYPE_PRODUCT, prodId));
    }

    // ✅ 이미지 업로드(여러 장 가능)
    // form-data:
    // - files: (file) 여러 개
    @PostMapping(value = "/{prodId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> uploadImages(
            @PathVariable("prodId") Integer prodId,
            @RequestPart("files") List<MultipartFile> files
    ) {
        productService.getProduct(prodId);

        FileUploadRequest req = FileUploadRequest.builder()
                .fileParentType(PARENT_TYPE_PRODUCT)
                .fileParentId(prodId)
                .files(files)
                .build();

        return ApiResponse.ok(fileService.uploadFiles(req));
    }

    // ✅ 대표 1장 정책으로 “교체”하고 싶으면 이걸 사용
    // - 기존 이미지 전부 soft delete 후 새 파일 1장 업로드
    // form-data:
    // - file: (file) 1개
    @PutMapping(value = "/{prodId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> replaceMainImage(
            @PathVariable("prodId") Integer prodId,
            @RequestPart("file") MultipartFile file
    ) {
        productService.getProduct(prodId);

        // 기존 파일 전체 soft delete
        List<FileResponse> all = fileService.getAllFilesForAdmin(PARENT_TYPE_PRODUCT, prodId);
        if (all != null && !all.isEmpty()) {
            fileService.softDeleteFiles(all.stream().map(FileResponse::getFileId).toList());
        }

        FileUploadRequest req = FileUploadRequest.builder()
                .fileParentType(PARENT_TYPE_PRODUCT)
                .fileParentId(prodId)
                .files(List.of(file))
                .build();

        return ApiResponse.ok(fileService.uploadFiles(req));
    }

    // ✅ 특정 이미지 삭제(soft delete)
    // body: [fileId, fileId, ...]
    @DeleteMapping("/{prodId}/images")
    public ApiResponse<Void> deleteImages(
            @PathVariable("prodId") Integer prodId,
            @RequestBody List<Integer> fileIds
    ) {
        productService.getProduct(prodId);
        fileService.softDeleteFilesByParent(PARENT_TYPE_PRODUCT, prodId, fileIds);
        return ApiResponse.ok();
    }
}