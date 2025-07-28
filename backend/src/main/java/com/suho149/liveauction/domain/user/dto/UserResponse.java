package com.suho149.liveauction.domain.user.dto;

import com.suho149.liveauction.domain.delivery.entity.Address;
import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
public class UserResponse {
    private final Long id;
    private final String name;
    private final String email;
    private final String picture;
    private final Address defaultAddress;
    private final Role role;

    @Builder
    private UserResponse(Long id, String name, String email, String picture, Address defaultAddress, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.picture = picture;
        this.defaultAddress = defaultAddress;
        this.role = role;
    }

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .picture(user.getPicture())
                .defaultAddress(user.getDefaultAddress())
                .role(user.getRole())
                .build();
    }
}
