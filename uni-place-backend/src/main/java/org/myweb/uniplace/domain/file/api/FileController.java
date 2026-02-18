package org.myweb.uniplace.domain.file.api;

// 파일명 인코딩용: 다운로드 시 한글/공백 파일명이 깨지지 않게 처리
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

// 파일 경로/존재/정상 파일 체크에 사용
import java.nio.file.*;

// 목록 조회(list) 결과, 삭제할 fileId 목록 등에 사용
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;   // 업로드 요청 DTO(부모타입/부모ID/파일들)
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;       // 파일 메타 정보 응답 DTO
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse; // 업로드 결과(여러 파일) 응답 DTO
import org.myweb.uniplace.domain.file.application.FileService;             // 비즈니스 로직(저장/조회/삭제) 담당
import org.myweb.uniplace.global.response.ApiResponse;                     // 공통 응답 포맷(성공/실패 래핑)

// application.yml에 설정한 경로(file.upload-path)를 주입받기 위한 어노테이션
import org.springframework.beans.factory.annotation.Value;

// 파일을 내려줄 때 ResponseEntity의 body로 사용할 타입
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

// HTTP 응답 헤더(다운로드/미리보기 처리) 세팅용
import org.springframework.http.*;

// @ModelAttribute로 받은 DTO 검증(@NotNull, @NotBlank 등) 활성화
import org.springframework.validation.annotation.Validated;

// Controller 어노테이션들
import org.springframework.web.bind.annotation.*;

// 생성자 주입을 자동으로 만들어주는 Lombok
import lombok.RequiredArgsConstructor;

/**
 * FileController
 *
 * 역할(초보용 설명)
 * - "요청을 받는 창구" 역할
 * - 실제 저장/조회/삭제 같은 중요한 작업은 Service가 한다.
 *
 * 흐름
 * 클라이언트(프론트) -> Controller(요청 받음) -> Service(실제 처리) -> Controller(응답 반환)
 *
 * 이 컨트롤러가 하는 일
 * 1) 업로드(여러 파일)         POST /files
 * 2) 목록조회(삭제 제외)       GET  /files?parentType=...&parentId=...
 * 3) 단건조회(삭제 제외)       GET  /files/{fileId}
 * 4) 다운로드(삭제 제외)       GET  /files/{fileId}/download
 * 5) 미리보기(삭제 제외)       GET  /files/{fileId}/view
 * 6) 소속검증 삭제              DELETE /files?parentType=...&parentId=...   body:[fileId들]
 * 7) 관리자 삭제(검증 없음)     DELETE /files/admin   body:[fileId들]
 *
 * 관리자 조회 기능
 * 8) 관리자 목록(삭제 포함)     GET /files/admin?parentType=...&parentId=...
 * 9) 관리자 단건(삭제 포함)     GET /files/admin/{fileId}
 * 10) 관리자 다운로드            GET /files/admin/{fileId}/download
 * 11) 관리자 미리보기            GET /files/admin/{fileId}/view
 *
 * 왜 일반/관리자 API를 분리했나?
 * - 일반 사용자는 "삭제된 파일은 안 보이게" 해야 함
 * - 관리자는 "삭제된 파일도 확인"할 수 있어야 함
 * - 그래서 service에서 일반용/관리자용 조회 메서드를 따로 둠
 */
@RestController // 이 클래스는 REST API 컨트롤러다(JSON 응답)
@RequiredArgsConstructor // final 필드들에 대한 생성자를 만들어서 DI(주입)한다
@RequestMapping("/files") // 이 컨트롤러의 기본 URL 시작은 /files
public class FileController {

    /**
     * Service는 "실제 일"을 한다.
     * - 저장, 조회, 삭제 같은 비즈니스 로직은 Controller가 아니라 Service에 있어야 유지보수가 편하다.
     */
    private final FileService fileService;

    /**
     * 업로드 파일이 저장될 "기본 폴더(절대 경로)"
     *
     * application.yml 예)
     * file:
     *   upload-path: C:/uniplace/upload
     *
     * 왜 yml로 받나?
     * - 로컬/운영 서버마다 경로가 다르기 때문
     * - 코드 수정 없이 설정만 바꿀 수 있음
     */
    @Value("${file.upload-path}")
    private String uploadBasePath;

    /**
     * [업로드] POST /files
     *
     * - multipart/form-data 요청을 받는다 (파일 업로드 형식)
     * - @ModelAttribute는 form-data로 넘어오는 값들을 DTO로 묶어준다
     * - @Validated는 DTO에 validation(@NotNull 등)이 있으면 검증하게 한다
     *
     * 동작:
     * 1) 파일 + parentType/parentId 받아옴
     * 2) fileService.uploadFiles() 호출
     * 3) 업로드된 파일들의 메타 정보를 응답으로 반환
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> upload(@Validated @ModelAttribute FileUploadRequest request) {
        return ApiResponse.ok(fileService.uploadFiles(request));
    }

    // =========================
    // 일반(삭제 제외) API
    // =========================

    /**
     * [목록조회] GET /files?parentType=ROOM&parentId=10
     *
     * - 특정 도메인(ROOM/BOARD/...)의 "활성 파일(delete_yn='N')"만 가져온다
     * - 삭제된 파일은 보이면 안 되기 때문에 "일반용" 조회는 삭제 제외가 기본
     *
     * @RequestParam을 쓰는 이유:
     * - /files?parentType=...&parentId=... 이런 형태로 파라미터를 받기 위해
     */
    @GetMapping
    public ApiResponse<List<FileResponse>> list(
            @RequestParam String parentType,
            @RequestParam Integer parentId
    ) {
        // Service에서 deleteYn='N' 조건으로 조회하도록 구현되어 있어야 함(B안 구조)
        return ApiResponse.ok(fileService.getActiveFiles(parentType, parentId));
    }

    /**
     * [단건 메타 조회] GET /files/{fileId}
     *
     * - DB에 저장된 파일 정보(원본명/저장명/경로/확장자/사이즈)를 내려준다
     * - 실제 파일 바이트를 내려주지 않음 (파일 자체는 download/view에서 내려줌)
     *
     * @PathVariable을 쓰는 이유:
     * - URL 경로에 있는 값(/files/123)에서 123을 꺼내오기 위해
     */
    @GetMapping("/{fileId}")
    public ApiResponse<FileResponse> get(@PathVariable Integer fileId) {
        return ApiResponse.ok(fileService.getFile(fileId));
    }

    /**
     * [다운로드] GET /files/{fileId}/download
     *
     * - 실제 파일을 "다운로드"로 내려준다
     *
     * 왜 ResponseEntity<Resource>로 반환하나?
     * - 파일은 JSON이 아니라 바이너리 데이터(이미지/pdf/zip 등)라서
     * - Content-Type / Content-Disposition 같은 HTTP 헤더를 세팅해야 함
     */
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable Integer fileId) throws Exception {

        // 1) 파일 메타 정보를 DB에서 가져온다(삭제 제외)
        FileResponse meta = fileService.getFile(fileId);

        // 2) 실제 파일 경로 만들기
        // uploadBasePath(절대 경로) + filePath(상대 경로) + renameFilename(저장 파일명)
        Path filePath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize(); // .. 같은 이상한 경로 조작을 줄이는 안전 처리

        // 3) 파일이 존재하고 "정상 파일"인지 체크
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        // 4) 파일을 Resource로 감싸서 ResponseEntity로 내려주기
        UrlResource resource = new UrlResource(filePath.toUri());

        // 5) 한글/공백 파일명 깨짐 방지 (브라우저마다 문제 생길 수 있어 인코딩)
        String encoded = URLEncoder.encode(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20"); // 공백을 +로 바꾸는 문제를 %20으로 고정

        // 6) Content-Disposition: attachment => 브라우저가 "다운로드"로 처리
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(encoded, StandardCharsets.UTF_8)
                .build();

        // 7) 응답 헤더 세팅
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM); // 어떤 파일이든 일단 다운로드용 기본 타입

        // 8) 최종 응답
        return ResponseEntity.ok().headers(headers).body(resource);
    }

    /**
     * [미리보기] GET /files/{fileId}/view
     *
     * - 브라우저에서 바로 열릴 수 있으면 열어준다(이미지, pdf, txt 등)
     * - Content-Disposition: inline 으로 설정하면 "다운로드"가 아니라 "바로 보기" 시도
     */
    @GetMapping("/{fileId}/view")
    public ResponseEntity<Resource> view(@PathVariable Integer fileId) throws Exception {

        // 1) 메타 조회(삭제 제외)
        FileResponse meta = fileService.getFile(fileId);

        // 2) 실제 파일 경로
        Path filePath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        // 3) 파일 존재/정상파일 체크
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        // 4) Resource 생성
        UrlResource resource = new UrlResource(filePath.toUri());

        // 5) 확장자 기반으로 브라우저가 이해할 Content-Type을 정해줌
        // - 이미지면 image/png 등으로 보내야 브라우저가 화면에 렌더링할 수 있음
        MediaType mediaType = guessMediaType(meta.getFileType());

        // 6) 파일명 인코딩
        String encoded = URLEncoder.encode(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        // 7) inline => 브라우저에서 열기 시도
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(encoded, StandardCharsets.UTF_8)
                .build();

        // 8) 헤더 세팅
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(mediaType);

        // 9) 응답
        return ResponseEntity.ok().headers(headers).body(resource);
    }

    /**
     * [삭제(권장)] DELETE /files?parentType=ROOM&parentId=10
     * Body: [1,2,3]
     *
     * - "소속 검증"이 되는 soft delete
     * - 즉, ROOM/10에 속한 파일만 delete_yn='Y'로 바꾼다
     *
     * 왜 소속 검증이 필요하나?
     * - 사용자가 남의 파일 ID를 알아내서 삭제 요청하면 위험
     * - parentType/parentId를 함께 받아서 "이 파일이 이 소속이 맞는지" 확인 후 삭제
     */
    @DeleteMapping
    public ApiResponse<Void> deleteByParent(
            @RequestParam String parentType,
            @RequestParam Integer parentId,
            @RequestBody List<Integer> fileIds
    ) {
        fileService.softDeleteFilesByParent(parentType, parentId, fileIds);
        return ApiResponse.ok();
    }

    /**
     * [관리자 삭제(검증 없음)] DELETE /files/admin
     * Body: [1,2,3]
     *
     * - fileId만으로 삭제 처리(delete_yn='Y')
     * - 소속 검증이 없어서 "일반 사용자 API에 쓰면 위험"
     * - 관리자/배치 같은 내부 용도로만 사용
     */
    @DeleteMapping("/admin")
    public ApiResponse<Void> deleteByIds(@RequestBody List<Integer> fileIds) {
        fileService.softDeleteFiles(fileIds);
        return ApiResponse.ok();
    }

    // =========================
    // 관리자(삭제 포함) 조회 API
    // =========================

    /**
     * [관리자 목록 조회] GET /files/admin?parentType=ROOM&parentId=10
     *
     * - 일반 목록조회와 차이:
     *   delete_yn='Y'인 "삭제된 파일"도 포함해서 가져온다
     *
     *  필요 이유!
     * - 관리자는 삭제된 파일도 확인/감사(로그)/복구 판단 등을 해야 할 수 있음
     */
    @GetMapping("/admin")
    public ApiResponse<List<FileResponse>> adminList(
            @RequestParam String parentType,
            @RequestParam Integer parentId
    ) {
        return ApiResponse.ok(fileService.getAllFilesForAdmin(parentType, parentId));
    }

    /**
     * [관리자 단건 조회] GET /files/admin/{fileId}
     *
     * - delete_yn='Y'인 파일도 조회 가능
     */
    @GetMapping("/admin/{fileId}")
    public ApiResponse<FileResponse> adminGet(@PathVariable Integer fileId) {
        return ApiResponse.ok(fileService.getFileForAdmin(fileId));
    }

    /**
     * [관리자 다운로드] GET /files/admin/{fileId}/download
     *
     * - 삭제된 파일이라도 관리자라면 다운로드 가능하게 함
     */
    @GetMapping("/admin/{fileId}/download")
    public ResponseEntity<Resource> adminDownload(@PathVariable Integer fileId) throws Exception {

        // 관리자용 메타 조회(삭제 포함)
        FileResponse meta = fileService.getFileForAdmin(fileId);

        Path filePath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(filePath.toUri());

        String encoded = URLEncoder.encode(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(encoded, StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    /**
     * [관리자 미리보기] GET /files/admin/{fileId}/view
     *
     * - 삭제된 파일이라도 관리자라면 미리보기 가능하게 함
     */
    @GetMapping("/admin/{fileId}/view")
    public ResponseEntity<Resource> adminView(@PathVariable Integer fileId) throws Exception {

        // 관리자용 메타 조회(삭제 포함)
        FileResponse meta = fileService.getFileForAdmin(fileId);

        Path filePath = Paths.get(uploadBasePath)
                .resolve(meta.getFilePath())
                .resolve(meta.getRenameFilename())
                .normalize();

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource resource = new UrlResource(filePath.toUri());

        MediaType mediaType = guessMediaType(meta.getFileType());

        String encoded = URLEncoder.encode(meta.getOriginFilename(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        ContentDisposition disposition = ContentDisposition.inline()
                .filename(encoded, StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(disposition);
        headers.setContentType(mediaType);

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    /**
     * 확장자(fileType)로 Content-Type(MediaType)을 "대충" 추정해주는 함수
     *
     * 왜 필요?
     * - /view(미리보기)에서 브라우저가 파일을 올바르게 렌더링하려면 Content-Type이 중요함
     * - 예: PNG인데 application/octet-stream이면 다운로드로 뜰 가능성이 큼
     *
     * 주의:
     * - 확장자만 보고 판단하므로 100% 정확하진 않음
     * - 그래도 대부분 브라우저 렌더링에는 충분
     */
    private MediaType guessMediaType(String ext) {
        if (ext == null) return MediaType.APPLICATION_OCTET_STREAM;
        String e = ext.toLowerCase();

        return switch (e) {
            case ".png" -> MediaType.IMAGE_PNG;
            case ".jpg", ".jpeg" -> MediaType.IMAGE_JPEG;
            case ".gif" -> MediaType.IMAGE_GIF;
            case ".webp" -> MediaType.parseMediaType("image/webp");
            case ".pdf" -> MediaType.APPLICATION_PDF;
            case ".txt" -> MediaType.TEXT_PLAIN;
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}