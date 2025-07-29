package com.suho149.liveauction.domain.admin.dto;

import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Getter;

@Getter
public class UserSummaryResponse {
    private final Long userId;
    private final String email;
    private final String name;
    private final Role role;
    private final int salesCount;

    public UserSummaryResponse(User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.role = user.getRole();
        this.salesCount = user.getSalesCount();
    }

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(user);
    }
}
