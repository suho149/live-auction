package com.suho149.liveauction.domain.user.repository;

import com.suho149.liveauction.domain.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepositoryCustom {
    Page<User> searchUsers(String name, String email, Pageable pageable);
}
