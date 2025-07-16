package com.suho149.liveauction.infra.image;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadImages(@RequestParam("files") MultipartFile[] files) {
        List<String> imageUrls = Arrays.stream(files)
                .map(file -> {
                    try {
                        return imageService.uploadImage(file);
                    } catch (IOException e) {
                        throw new RuntimeException("Image upload failed", e);
                    }
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(imageUrls);
    }
}