package org.myweb.uniplace.global.config;

import java.nio.file.Paths;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ApiListCacheControlInterceptor apiListCacheControlInterceptor;

    @Value("${APP_CORS_ALLOWED_ORIGINS:*}")
    private String corsAllowedOrigins;

    /**
     * 로컬 개발 시 업로드 폴더를 /static-files/** 로 직접 서빙
     * (FileController /view /download 엔드포인트와 별개로 추가 제공)
     * storage.type=s3 이면 이 경로는 사용되지 않음
     */
    @Value("${file.upload-path:../uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 상대경로(./uploads)도 동작하도록 toAbsolutePath()로 변환
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toString()
                .replace("\\", "/");
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

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(apiListCacheControlInterceptor);
    }
}
