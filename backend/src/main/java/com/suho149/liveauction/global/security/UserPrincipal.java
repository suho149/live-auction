package com.suho149.liveauction.global.security;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.suho149.liveauction.domain.user.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class UserPrincipal implements UserDetails, OAuth2User {

    private Long id;
    private String email;
    private Collection<? extends GrantedAuthority> authorities;
    private Map<String, Object> attributes;

    // Jackson 라이브러리가 Redis의 JSON 데이터를 객체로 변환(역직렬화)할 때,
    // 먼저 이 생성자를 호출하여 빈 객체를 만들기 위해 반드시 필요합니다.
    public UserPrincipal() {
    }

    // @JsonCreator: Jackson에게 "JSON 데이터를 객체로 만들 때 이 생성자를 사용해라"고 알려줍니다.
    // @JsonProperty: JSON의 특정 필드와 생성자의 파라미터를 1:1로 매핑시켜줍니다.
    @JsonCreator
    public UserPrincipal(
            @JsonProperty("id") Long id,
            @JsonProperty("email") String email,
            @JsonProperty("authorities") Collection<? extends GrantedAuthority> authorities
    ) {
        this.id = id;
        this.email = email;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRoleKey()))
        );
    }

    public static UserPrincipal create(User user, Map<String, Object> attributes) {
        UserPrincipal userPrincipal = create(user);
        userPrincipal.setAttributes(attributes);
        return userPrincipal;
    }

    // User 엔티티가 필요한 곳에서 프록시 객체를 반환하기 위한 편의 메소드
    @JsonIgnore // 이 메소드는 직렬화 대상이 아님
    public User toUserEntity() {
        User user = new User();
        // 실제로는 User 엔티티에 id를 설정할 수 있는 setter나 reflection을 사용해야 하지만,
        // JPA는 영속성 컨텍스트 내에서 프록시 객체의 ID만으로도 관계를 설정할 수 있습니다.
        // 하지만 User에 id를 설정할 수 없다면, 이 방법 대신 서비스 레이어에서
        // userRepository.getReferenceById(this.id)를 사용하는 것이 더 정석적입니다.
        // User 엔티티에 protected 또는 public setter for id가 있다면 아래 코드가 동작합니다.
        // 예시: user.setId(this.id);

        // 더 안전한 방법은 User 엔티티를 직접 생성하지 않고,
        // 서비스 레이어에서 ID를 사용하여 프록시를 가져오는 것입니다.
        // 지금은 LikeService에서 바로 처리하도록 수정하겠습니다.
        // 따라서 이 메소드는 사실상 필요 없어집니다. 아래 LikeService 수정안을 참고하세요.
        return null; // 이 메소드 대신 LikeService에서 직접 처리
    }

    // UserDetails 구현
    @Override
    @JsonIgnore
    public String getUsername() {
        return email; // getUsername()은 우리 시스템에서 이메일을 반환
    }

    @Override
    @JsonIgnore // 이 필드는 JSON으로 변환하지 않음
    public String getPassword() {
        return null;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return true;
    }

    // OAuth2User 구현 메소드
    @Override
    @JsonIgnore // attributes는 OAuth2 로그인 시에만 사용되므로, 캐시에는 저장하지 않음
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    @JsonIgnore
    public String getName() {
        return String.valueOf(id);
    }


    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
}
