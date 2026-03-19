package org.myweb.uniplace.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${APP_CORS_ALLOWED_ORIGINS:*}")
    private String corsAllowedOrigins;

    /**
     * 로컬 개발 시 업로드 폴더를 /static-files/** 로 직접 서빙
     * (FileController /view /download 엔드포인트와 별개로 추가 제공)
     * storage.type=s3 이면 이 경로는 사용되지 않음
     */
    @Value("${file.upload-path:C:/uniplace/uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // file:/// 프로토콜로 로컬 디스크 경로 등록
        String location = uploadDir.replace("\\", "/");
        if (!location.endsWith("/")) location += "/";

        registry.addResourceHandler("/static-files/**")
                .addResourceLocations("file:///" + location);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = corsAllowedOrigins.split(",");
        registry.addMapping("/**")
                .allowedOriginPatterns(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}