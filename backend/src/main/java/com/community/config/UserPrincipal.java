package com.community.config;

import com.community.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String name;
    private final Long communityId;
    private final String communityName;
    private final String flatOrRoomNo;
    private final Boolean isPeerProvider;
    private final Collection<? extends GrantedAuthority> authorities;
    private final String phone;
    private final Boolean isApproved;
    private final java.time.LocalDateTime createdAt;

    public static UserPrincipal create(User user) {
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());
        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getName(),
                user.getCommunity().getId(),
                user.getCommunity().getName(),
                user.getFlatOrRoomNo(),
                user.getIsPeerProvider(),
                Collections.singletonList(authority),
                user.getPhone(),
                user.getIsApproved(),
                user.getCreatedAt()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
