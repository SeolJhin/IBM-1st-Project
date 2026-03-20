package org.myweb.uniplace.global.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.global.config.UploadProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final UploadProperties props;

    private String normalizePath(String value) {
        if (value == null) return "";
        String normalized = value.trim().replace("\\", "/");
        while (normalized.startsWith("/")) normalized = normalized.substring(1);
        normalized = normalized.replaceAll("/+", "/");
        return normalized;
    }

    private boolean looksLikeFilePath(String value) {
        String normalized = normalizePath(value);
        if (normalized.isBlank() || normalized.endsWith("/")) return false;
        int slash = normalized.lastIndexOf('/');
        String last = slash >= 0 ? normalized.substring(slash + 1) : normalized;
        int dot = last.lastIndexOf('.');
        return dot > 0 && dot < last.length() - 1;
    }

    private String toKey(String relativeDir, String fileName) {
        String dir = normalizePath(relativeDir);
        String name = normalizePath(fileName);
        if (dir.isBlank()) return name;
        if (name.isBlank()) return dir;
        return dir.endsWith("/") ? dir + name : dir + "/" + name;
    }

    private List<String> keyCandidates(String relativeDir, String fileName) {
        String normalizedDir = normalizePath(relativeDir);
        String normalizedName = normalizePath(fileName);
        Set<String> candidates = new LinkedHashSet<>();

        if (looksLikeFilePath(normalizedDir)) {
            candidates.add(normalizedDir);
            int slash = normalizedDir.lastIndexOf('/');
            if (slash >= 0) {
                String parent = normalizedDir.substring(0, slash);
                candidates.add(toKey(parent, normalizedName));
            }
        }

        candidates.add(toKey(normalizedDir, normalizedName));
        candidates.remove("");
        return new ArrayList<>(candidates);
    }

    private boolean isMissingOrDenied(S3Exception e) {
        String code = e.awsErrorDetails() == null ? "" : String.valueOf(e.awsErrorDetails().errorCode());
        int status = e.statusCode();
        return status == 404
                || status == 403
                || "NoSuchKey".equalsIgnoreCase(code)
                || "AccessDenied".equalsIgnoreCase(code);
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
        log.info("[S3Storage] upload complete: {}/{}", relativeDir, fileName);
    }

    @Override
    public String resolveViewUrl(Integer fileId, String relativeDir, String fileName) {
        String baseUrl = props.getS3BaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return "/files/" + fileId + "/view";
        }
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        String key = looksLikeFilePath(relativeDir) ? normalizePath(relativeDir) : toKey(relativeDir, fileName);
        return baseUrl + "/" + key;
    }

    @Override
    public String resolveDownloadUrl(Integer fileId, String relativeDir, String fileName) {
        return resolveViewUrl(fileId, relativeDir, fileName);
    }

    @Override
    public InputStream read(String relativeDir, String fileName) throws IOException {
        S3Exception lastMissing = null;

        for (String key : keyCandidates(relativeDir, fileName)) {
            try {
                GetObjectRequest req = GetObjectRequest.builder()
                        .bucket(props.getS3Bucket())
                        .key(key)
                        .build();
                return s3Client.getObject(req);
            } catch (NoSuchKeyException e) {
                lastMissing = e;
            } catch (S3Exception e) {
                if (isMissingOrDenied(e)) {
                    lastMissing = e;
                    continue;
                }
                throw new IOException("Failed to read object from S3", e);
            }
        }

        String fallback = toKey(relativeDir, fileName);
        throw new FileNotFoundException(
                "S3 object not found: " + fallback + (lastMissing == null ? "" : " (" + lastMissing.getMessage() + ")")
        );
    }

    @Override
    public void delete(String relativeDir, String fileName) {
        try {
            for (String key : keyCandidates(relativeDir, fileName)) {
                DeleteObjectRequest req = DeleteObjectRequest.builder()
                        .bucket(props.getS3Bucket())
                        .key(key)
                        .build();
                s3Client.deleteObject(req);
            }
            log.info("[S3Storage] delete complete: {}/{}", relativeDir, fileName);
        } catch (Exception e) {
            log.warn("[S3Storage] delete failed: {}/{} - {}", relativeDir, fileName, e.getMessage());
        }
    }
}
