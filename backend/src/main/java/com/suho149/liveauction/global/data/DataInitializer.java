package com.suho149.liveauction.global.data;

import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j // 로깅을 위해 추가
@Component
@RequiredArgsConstructor
@Profile("local")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final String ADMIN_EMAIL = "yousuho1001@gmail.com"; // 관리자 계정 이메일
    private final String ADMIN_NAME = "관리자";

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("===== 데이터 초기화 작업 시작 (local profile) =====");

        // ★★★ 'Find or Create' 로직으로 수정 ★★★
        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
                // 1. 이메일에 해당하는 사용자가 이미 존재할 경우
                user -> {
                    // 역할이 ADMIN이 아니면 ADMIN으로 변경
                    if (user.getRole() != Role.ADMIN) {
                        log.info("기존 사용자 {}에게 ADMIN 권한을 부여합니다.", ADMIN_EMAIL);
                        user.updateRole(Role.ADMIN);
                    } else {
                        log.info("관리자 계정({})이 이미 존재하며, 권한이 올바릅니다.", ADMIN_EMAIL);
                    }
                },
                // 2. 이메일에 해당하는 사용자가 존재하지 않을 경우
                () -> {
                    log.info("관리자 계정({})이 존재하지 않아 새로 생성합니다.", ADMIN_EMAIL);
                    User admin = User.builder()
                            .email(ADMIN_EMAIL)
                            .name(ADMIN_NAME)
                            .role(Role.ADMIN)
                            .picture(null) // 기본 프로필 이미지 URL을 넣어도 좋음
                            .build();
                    userRepository.save(admin);
                }
        );
        log.info("===== 데이터 초기화 작업 완료 =====");
    }
}
