package org.myweb.uniplace.domain.file.application;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.domain.entity.UploadFile;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
import org.myweb.uniplace.domain.file.repository.UploadFileRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.util.FileNameChange;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FileServiceImpl implements FileService {

    private static final String NOT_DELETED = "N";

    private final UploadFileRepository uploadFileRepository;

    @Value("${file.upload-path}")
    private String uploadBasePath;

    private static final List<String> ALLOWED_EXT = List.of(
            ".png", ".jpg", ".jpeg", ".gif", ".webp",
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
            ".txt", ".zip"
    );

    private static final long MAX_FILE_SIZE = Integer.MAX_VALUE;

    @Override
    public FileUploadResponse uploadFiles(FileUploadRequest request) {
        List<FileResponse> uploaded = new ArrayList<>();

        if (request == null) {
            return FileUploadResponse.builder().files(uploaded).build();
        }

        String parentType = normalizeParentType(request.getFileParentType());

        Integer parentId = request.getFileParentId();
        if (parentId == null) {
            throw new IllegalArgumentException("fileParentId는 필수입니다.");
        }

        if (request.getFiles() == null || request.getFiles().isEmpty()) {
            return FileUploadResponse.builder()
                    .fileParentType(parentType)
                    .fileParentId(parentId)
                    .files(uploaded)
                    .build();
        }

        List<Path> written = new ArrayList<>();

        try {
            for (MultipartFile file : request.getFiles()) {
                if (file == null || file.isEmpty()) continue;

                UploadFile saved = saveSingle(parentType, parentId, file, written);
                uploaded.add(FileResponse.fromEntity(saved));
            }
        } catch (Exception e) {
            for (Path p : written) {
                try { Files.deleteIfExists(p); } catch (IOException ignore) {}
            }
            throw (e instanceof RuntimeException) ? (RuntimeException) e : new RuntimeException(e);
        }

        return FileUploadResponse.builder()
                .fileParentType(parentType)
                .fileParentId(parentId)
                .files(uploaded)
                .build();
    }

    @Transactional(readOnly = true)
    public List<FileResponse> getActiveFiles(String parentType, Integer parentId) {
        String normalized = normalizeParentType(parentType);

        List<UploadFile> files =
                uploadFileRepository.findByFileParentTypeAndFileParentIdAndDeleteYnOrderByFileIdDesc(
                        normalized, parentId, NOT_DELETED
                );

        return files.stream().map(FileResponse::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FileResponse getFile(Integer fileId) {
        UploadFile file = uploadFileRepository.findByFileIdAndDeleteYn(fileId, NOT_DELETED)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        return FileResponse.fromEntity(file);
    }

    @Transactional(readOnly = true)
    public List<FileResponse> getAllFilesForAdmin(String parentType, Integer parentId) {
        String normalized = normalizeParentType(parentType);

        List<UploadFile> files =
                uploadFileRepository.findByFileParentTypeAndFileParentIdOrderByFileIdDesc(
                        normalized, parentId
                );

        return files.stream().map(FileResponse::fromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FileResponse getFileForAdmin(Integer fileId) {
        UploadFile file = uploadFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        return FileResponse.fromEntity(file);
    }

    @Override
    public void softDeleteFiles(List<Integer> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) return;
        uploadFileRepository.softDeleteByIds(fileIds);
    }

    @Override
    public void softDeleteFilesByParent(String parentType, Integer parentId, List<Integer> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) return;
        String normalized = normalizeParentType(parentType);
        uploadFileRepository.softDeleteByIdsAndParent(fileIds, normalized, parentId);
    }

    private UploadFile saveSingle(
            String parentType,
            Integer parentId,
            MultipartFile file,
            List<Path> written
    ) throws IOException {

        String original = safeOriginalFilename(file);

        String extension = extractExtension(original);
        validateExtension(extension);

        long size = file.getSize();
        if (size <= 0) throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        if (size > MAX_FILE_SIZE) throw new IllegalArgumentException("파일이 너무 큽니다. size=" + size);

        String renamed = FileNameChange.change(original);

        String relativeDir = buildRelativeDir(parentType, parentId);

        Path dirPath = Paths.get(uploadBasePath).resolve(relativeDir);
        Files.createDirectories(dirPath);

        Path dest = dirPath.resolve(renamed);
        file.transferTo(dest.toFile());
        written.add(dest);

        UploadFile entity = UploadFile.builder()
                .fileParentType(parentType)
                .fileParentId(parentId)
                .filePath(toUnixPath(relativeDir))
                .originFilename(original)
                .renameFilename(renamed)
                .fileSize((int) size)
                .fileType(extension)
                .build();

        return uploadFileRepository.save(entity);
    }

    private String normalizeParentType(String parentType) {
        return FileRefType.from(parentType).dbValue();
    }

    private String buildRelativeDir(String parentType, Integer parentId) {
        LocalDate today = LocalDate.now();
        return String.format("%s/%d/%04d/%02d/%02d/",
                parentType,
                parentId,
                today.getYear(),
                today.getMonthValue(),
                today.getDayOfMonth()
        );
    }

    private String safeOriginalFilename(MultipartFile file) {
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) original = "unnamed";
        int idx = Math.max(original.lastIndexOf('/'), original.lastIndexOf('\\'));
        if (idx >= 0) original = original.substring(idx + 1);
        return original;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        if (idx < 0) return "";
        String ext = filename.substring(idx).toLowerCase();
        if (ext.length() > 20) ext = ext.substring(0, 20);
        return ext;
    }

    private void validateExtension(String ext) {
        if (ext == null || ext.isBlank() || ".".equals(ext)) {
            throw new IllegalArgumentException("확장자가 없는 파일은 업로드할 수 없습니다.");
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("허용되지 않는 파일 확장자입니다: " + ext);
        }
    }

    private String toUnixPath(String path) {
        return path == null ? null : path.replace("\\", "/");
    }
}

