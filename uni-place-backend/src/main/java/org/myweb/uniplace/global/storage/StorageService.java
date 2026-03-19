package org.myweb.uniplace.global.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;

public interface StorageService {

    /**
     * 파일 저장
     * @param file      업로드 파일
     * @param relativeDir  상대 디렉토리  예: ROOM/10/2026/03/18/
     * @param fileName  저장 파일명 (이미 rename 된 값)
     */
    void store(MultipartFile file, String relativeDir, String fileName) throws IOException;

    /**
     * fileId 기준 파일 접근 URL 반환
     * - 로컬: /files/{fileId}/view
     * - S3:   https://bucket.s3.region.amazonaws.com/relativeDir/fileName
     */
    String resolveViewUrl(Integer fileId, String relativeDir, String fileName);

    /**
     * fileId 기준 다운로드 URL 반환
     * - 로컬: /files/{fileId}/download
     * - S3:   https://... (동일 오브젝트, 필요 시 Content-Disposition 헤더는 프론트에서 처리)
     */
    String resolveDownloadUrl(Integer fileId, String relativeDir, String fileName);

    /**
     * 파일 읽기 (로컬: 디스크 / S3: S3 오브젝트)
     * InspectionServiceImpl, ContractImageServiceImpl 에서 Base64 변환 시 사용
     */
    InputStream read(String relativeDir, String fileName) throws IOException;

    /**
     * 파일 삭제 (soft-delete 이후 실제 파일 제거가 필요한 경우)
     */
    void delete(String relativeDir, String fileName);
}