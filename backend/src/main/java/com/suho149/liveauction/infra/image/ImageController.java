package com.suho149.liveauction.infra.image;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 로컬 개발용 이미지 업로드 시뮬레이션 컨트롤러입니다.
 * 실제 파일을 서버에 저장하지 않고, 이미지 호스팅 서비스의 URL 형식을 모방하여 반환합니다.
 */
@RestController
@RequestMapping("/api/v1/images")
public class ImageController {

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        // 실제 운영 환경에서는 이 부분에 AWS S3나 OCI Object Storage 업로드 로직이 들어갑니다.

        // 로컬 개발 시에는, 실제와 유사한 경험을 제공하기 위해
        // 이미지 플레이스홀더 서비스(placeholder.com)를 사용하여 가짜 URL을 생성합니다.
        // 이렇게 하면 프론트엔드에서 이미지가 보이는 것처럼 테스트할 수 있습니다.
        List<String> imageUrls = Arrays.stream(files)
                .map(file -> {
                    // 파일 이름을 URL에 포함시켜 어떤 파일이었는지 알아볼 수 있게 합니다.
                    String fileName = file.getOriginalFilename();
                    return "https://via.placeholder.com/600x400.png?text=" + fileName;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(imageUrls);
    }
}
