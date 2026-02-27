package org.myweb.uniplace.domain.commerce.api.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductCreateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.request.ProductUpdateRequest;
import org.myweb.uniplace.domain.commerce.api.dto.response.ProductBuildingStockResponse;
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

import java.util.List;

/**
 * 관리자용 Product Controller
 * - 상품 CRUD + 상품 이미지 관리 + 빌딩별 재고 관리
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/products")
public class AdminProductController {

    private static final String PARENT_TYPE_PRODUCT = "PRODUCT";

    private final ProductService productService;
    private final FileService    fileService;

    // ── 상품 CRUD ────────────────────────────────────────────────────────────

    @PostMapping
    public ApiResponse<Integer> create(@RequestBody @Valid ProductCreateRequest request) {
        return ApiResponse.ok(productService.createProduct(request).getProdId());
    }

    @PutMapping("/{prodId}")
    public ApiResponse<Void> update(
            @PathVariable("prodId") Integer prodId,
            @RequestBody @Valid ProductUpdateRequest request
    ) {
        productService.updateProduct(prodId, request);
        return ApiResponse.ok();
    }

    @PatchMapping("/{prodId}/status")
    public ApiResponse<Void> changeStatus(
            @PathVariable("prodId") Integer prodId,
            @RequestBody ProductStatus status
    ) {
        productService.changeStatus(prodId, status);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{prodId}")
    public ApiResponse<Void> delete(@PathVariable("prodId") Integer prodId) {
        productService.deleteProduct(prodId);
        return ApiResponse.ok();
    }

    // ── 빌딩별 재고 관리 ─────────────────────────────────────────────────────

    /**
     * 상품의 빌딩별 재고 목록 조회
     * GET /admin/products/{prodId}/building-stocks
     */
    @GetMapping("/{prodId}/building-stocks")
    public ApiResponse<List<ProductBuildingStockResponse>> getBuildingStocks(
            @PathVariable("prodId") Integer prodId
    ) {
        return ApiResponse.ok(productService.getBuildingStocks(prodId));
    }

    /**
     * 빌딩별 재고 설정 (없으면 생성, 있으면 업데이트)
     * PUT /admin/products/{prodId}/building-stocks/{buildingId}
     * body: { "stock": 100 }
     */
    @PutMapping("/{prodId}/building-stocks/{buildingId}")
    public ApiResponse<ProductBuildingStockResponse> upsertBuildingStock(
            @PathVariable("prodId") Integer prodId,
            @PathVariable("buildingId") Integer buildingId,
            @RequestBody @Valid BuildingStockUpsertRequest request
    ) {
        return ApiResponse.ok(
            productService.upsertBuildingStock(prodId, buildingId, request.getStock())
        );
    }

    // ── 상품 이미지 관리 ─────────────────────────────────────────────────────

    @GetMapping("/{prodId}/images")
    public ApiResponse<List<FileResponse>> images(@PathVariable("prodId") Integer prodId) {
        productService.getProduct(prodId);
        return ApiResponse.ok(fileService.getActiveFiles(PARENT_TYPE_PRODUCT, prodId));
    }

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

    @PutMapping(value = "/{prodId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> replaceMainImage(
            @PathVariable("prodId") Integer prodId,
            @RequestPart("file") MultipartFile file
    ) {
        productService.getProduct(prodId);
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

    @DeleteMapping("/{prodId}/images")
    public ApiResponse<Void> deleteImages(
            @PathVariable("prodId") Integer prodId,
            @RequestBody List<Integer> fileIds
    ) {
        productService.getProduct(prodId);
        fileService.softDeleteFilesByParent(PARENT_TYPE_PRODUCT, prodId, fileIds);
        return ApiResponse.ok();
    }

    // ── 내부 DTO ─────────────────────────────────────────────────────────────

    @Getter
    public static class BuildingStockUpsertRequest {
        @NotNull
        @Min(0)
        private Integer stock;
    }
}