package com.suho149.liveauction.global.oauth;

import com.suho149.liveauction.domain.user.entity.Role;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
public class OAuthAttributes {
    private Map<String, Object> attributes;
    private String nameAttributeKey;
    private String name;
    private String email;
    private String picture;

    @Builder
    public OAuthAttributes(Map<String, Object> attributes, String nameAttributeKey, String name, String email, String picture) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
        this.name = name;
        this.email = email;
        this.picture = picture;
    }

    // OAuth2User에서 반환하는 사용자 정보는 Map이라서 값 하나하나를 변환해야 한다.
    public static OAuthAttributes of(String registrationId, String userNameAttributeName, Map<String, Object> attributes) {
        // 나중에 네이버, 카카오 로그인 추가를 위해 분기 처리
        if ("google".equals(registrationId)) {
            return ofGoogle(userNameAttributeName, attributes);
        }
        // 다른 소셜 로그인을 추가할 경우 여기에 if문으로 추가

        return null; // 지원하지 않는 소셜 로그인일 경우
    }

    private static OAuthAttributes ofGoogle(String userNameAttributeName, Map<String, Object> attributes) {
        return OAuthAttributes.builder()
                .name((String) attributes.get("name"))
                .email((String) attributes.get("email"))
                .picture((String) attributes.get("picture"))
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    // User 엔티티 생성
    public User toEntity() {
        return User.builder()
                .name(name)
                .email(email)
                .picture(picture)
                .role(Role.USER) // 가입 시 기본 권한
                .build();
    }
}
