package org.myweb.uniplace.global.storage;

import org.myweb.uniplace.global.config.UploadProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.file.*;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private final UploadProperties props;

    private Path baseDir() {
        return Paths.get(props.getUploadDir()).toAbsolutePath().normalize();
    }

    @Override
    public void store(MultipartFile file, String relativeDir, String fileName) throws IOException {
        Path dir = baseDir().resolve(relativeDir);
        Files.createDirectories(dir);
        file.transferTo(dir.resolve(fileName).toFile());
    }

    @Override
    public String resolveViewUrl(Integer fileId, String relativeDir, String fileName) {
        return "/files/" + fileId + "/view";
    }

    @Override
    public String resolveDownloadUrl(Integer fileId, String relativeDir, String fileName) {
        return "/files/" + fileId + "/download";
    }

    @Override
    public InputStream read(String relativeDir, String fileName) throws IOException {
        Path path = baseDir()
                .resolve(relativeDir)
                .resolve(fileName)
                .normalize();
        return Files.newInputStream(path);
    }

    @Override
    public void delete(String relativeDir, String fileName) {
        try {
            Path path = baseDir()
                    .resolve(relativeDir)
                    .resolve(fileName)
                    .normalize();
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("[LocalStorage] 파일 삭제 실패: {}/{} - {}", relativeDir, fileName, e.getMessage());
        }
    }
}