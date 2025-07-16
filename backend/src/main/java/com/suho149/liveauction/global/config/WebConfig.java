package com.suho149.liveauction.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ★ 정적 리소스 핸들러 추가
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /images/** URL 요청이 오면, file:///경로/to/uploads/ 디렉토리에서 파일을 찾아 제공
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }
}
