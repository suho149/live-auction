package com.suho149.liveauction.infra.image;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageService {

    // 이미지를 저장할 로컬 경로를 application.yml에서 주입받음
    @Value("${file.upload-dir}")
    private String uploadDir;

    public String uploadImage(MultipartFile file) throws IOException {
        // 저장할 디렉토리가 없으면 생성
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 고유한 파일 이름 생성
        String storedFileName = UUID.randomUUID().toString() + fileExtension;

        // 파일을 지정된 경로에 저장
        file.transferTo(Paths.get(uploadDir, storedFileName));

        // 클라이언트가 접근할 수 있는 URL 경로를 반환
        return "/images/" + storedFileName;
    }
}
