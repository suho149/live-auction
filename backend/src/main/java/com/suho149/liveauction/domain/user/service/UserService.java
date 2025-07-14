package com.suho149.liveauction.domain.user.service;

import com.suho149.liveauction.domain.user.dto.UserResponse;
import com.suho149.liveauction.domain.user.entity.User;
import com.suho149.liveauction.domain.user.repository.UserRepository;
import com.suho149.liveauction.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * 현재 로그인한 사용자의 정보를 조회합니다.
     * @param userPrincipal 인증된 사용자의 정보
     * @return 사용자 정보 DTO
     */
    public UserResponse getMyInfo(UserPrincipal userPrincipal) {
        User user = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("유저를 찾을 수 없습니다. Email: " + userPrincipal.getEmail()));

        return UserResponse.from(user);
    }
}
