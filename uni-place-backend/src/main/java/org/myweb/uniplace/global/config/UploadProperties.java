package org.myweb.uniplace.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UploadProperties {

    /** local | s3  (기본값: local) */
    @Value("${storage.type:local}")
    private String storageType;

    /** 로컬 업로드 루트 디렉토리 */
    @Value("${file.upload-path:C:/uniplace/uploads}")
    private String uploadDir;

    /** S3 버킷 이름 */
    @Value("${aws.s3.bucket:}")
    private String s3Bucket;

    /** S3 리전 */
    @Value("${aws.s3.region:ap-northeast-2}")
    private String s3Region;

    /**
     * S3 파일 공개 base URL
     * 예: https://uniplace-static.s3.ap-northeast-2.amazonaws.com
     */
    @Value("${aws.s3.base-url:}")
    private String s3BaseUrl;

    public boolean isS3() {
        return "s3".equalsIgnoreCase(storageType);
    }

    public String getUploadDir()   { return uploadDir; }
    public String getS3Bucket()    { return s3Bucket; }
    public String getS3Region()    { return s3Region; }
    public String getS3BaseUrl()   { return s3BaseUrl; }
    public String getStorageType() { return storageType; }
}