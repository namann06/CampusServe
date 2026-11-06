package com.community.config;

import com.community.entity.User;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final Map<String, CachedPrincipal> principalCache = new ConcurrentHashMap<>();

    private record CachedPrincipal(UserPrincipal principal, long expiryMillis) {}

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null) {
            throw new UsernameNotFoundException("Email cannot be null");
        }
        String normalizedEmail = email.trim().toLowerCase();

        CachedPrincipal cached = principalCache.get(normalizedEmail);
        if (cached != null && System.currentTimeMillis() < cached.expiryMillis()) {
            return cached.principal();
        }

        User user = userRepository.findByEmailWithCommunity(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        UserPrincipal principal = UserPrincipal.create(user);
        
        // Cache user principal for 15 minutes to eliminate redundant auth queries across all API endpoints
        principalCache.put(normalizedEmail, new CachedPrincipal(principal, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(15)));
        return principal;
    }

    public void cachePrincipal(UserPrincipal principal) {
        if (principal != null && principal.getUsername() != null) {
            principalCache.put(principal.getUsername().toLowerCase(), new CachedPrincipal(principal, System.currentTimeMillis() + TimeUnit.MINUTES.toMillis(15)));
        }
    }

    public void evictUser(String email) {
        if (email != null) {
            principalCache.remove(email.trim().toLowerCase());
        }
    }

    public void clearCache() {
        principalCache.clear();
    }
}
