package org.myweb.uniplace.global.storage;

import org.myweb.uniplace.global.config.UploadProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final UploadProperties props;

    private String toKey(String relativeDir, String fileName) {
        String dir = relativeDir.endsWith("/") ? relativeDir : relativeDir + "/";
        return dir + fileName;
    }

    @Override
    public void store(MultipartFile file, String relativeDir, String fileName) throws IOException {
        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(props.getS3Bucket())
                .key(toKey(relativeDir, fileName))
                .contentType(file.getContentType())
                .contentLength(file.getSize())
                .build();

        s3Client.putObject(req, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        log.info("[S3Storage] 업로드 완료: {}/{}", relativeDir, fileName);
    }

    @Override
    public String resolveViewUrl(Integer fileId, String relativeDir, String fileName) {
        String baseUrl = props.getS3BaseUrl();
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        return baseUrl + "/" + toKey(relativeDir, fileName);
    }

    @Override
    public String resolveDownloadUrl(Integer fileId, String relativeDir, String fileName) {
        return resolveViewUrl(fileId, relativeDir, fileName);
    }

    @Override
    public InputStream read(String relativeDir, String fileName) {
        GetObjectRequest req = GetObjectRequest.builder()
                .bucket(props.getS3Bucket())
                .key(toKey(relativeDir, fileName))
                .build();
        return s3Client.getObject(req);
    }

    @Override
    public void delete(String relativeDir, String fileName) {
        try {
            DeleteObjectRequest req = DeleteObjectRequest.builder()
                    .bucket(props.getS3Bucket())
                    .key(toKey(relativeDir, fileName))
                    .build();
            s3Client.deleteObject(req);
            log.info("[S3Storage] 삭제 완료: {}/{}", relativeDir, fileName);
        } catch (Exception e) {
            log.warn("[S3Storage] 파일 삭제 실패: {}/{} - {}", relativeDir, fileName, e.getMessage());
        }
    }
}