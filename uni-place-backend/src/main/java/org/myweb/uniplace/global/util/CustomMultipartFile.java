package org.myweb.uniplace.global.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.*;

/**
 * base64로 받은 이미지 바이트를 MultipartFile로 변환하기 위한 구현체
 * InspectionServiceImpl의 saveDiffImage() 에서 사용합니다.
 */
public class CustomMultipartFile implements MultipartFile {

    private final byte[] content;
    private final String originalFilename;
    private final String contentType;

    public CustomMultipartFile(byte[] content, String originalFilename, String contentType) {
        this.content          = content;
        this.originalFilename = originalFilename;
        this.contentType      = contentType;
    }

    @Override public String  getName()             { return "file"; }
    @Override public String  getOriginalFilename() { return originalFilename; }
    @Override public String  getContentType()      { return contentType; }
    @Override public boolean isEmpty()             { return content == null || content.length == 0; }
    @Override public long    getSize()             { return content != null ? content.length : 0; }
    @Override public byte[]  getBytes()            { return content; }
    @Override public InputStream getInputStream()  { return new ByteArrayInputStream(content); }

    @Override
    public void transferTo(File dest) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(dest)) {
            fos.write(content);
        }
    }
}
