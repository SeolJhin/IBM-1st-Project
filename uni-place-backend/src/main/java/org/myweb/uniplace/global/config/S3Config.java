package org.myweb.uniplace.global.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.RequiredArgsConstructor;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3Config {

    private final UploadProperties props;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(props.getS3Region()))
                // EC2 IAM Role 또는 ~/.aws/credentials 자동 사용
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
}