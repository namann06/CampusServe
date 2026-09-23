package com.community.service;

import com.community.config.JwtTokenProvider;
import com.community.config.UserPrincipal;
import com.community.dto.AuthRequest;
import com.community.dto.AuthResponse;
import com.community.dto.RegisterRequest;
import com.community.dto.UserDto;
import com.community.entity.Community;
import com.community.entity.Role;
import com.community.entity.User;
import com.community.exception.AppException;
import com.community.repository.CommunityRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new AppException("Email already registered: " + request.getEmail(), HttpStatus.CONFLICT);
        }

        // Validate community passcode strictly
        Community community = communityRepository.findByPasscode(request.getCommunityPasscode().trim())
                .orElseThrow(() -> new AppException("Invalid community passcode. Registration rejected.", HttpStatus.FORBIDDEN));

        // Prevent self-registering as ADMIN unless initialized
        Role role = request.getRole();
        if (role == Role.ROLE_ADMIN) {
            throw new AppException("Admin registration is not allowed via public portal.", HttpStatus.FORBIDDEN);
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .flatOrRoomNo(request.getFlatOrRoomNumber().trim())
                .role(role)
                .isPeerProvider(Boolean.TRUE.equals(request.getIsPeerProvider()))
                .isApproved(true)
                .community(community)
                .build();

        User savedUser = userRepository.save(user);

        // Authenticate directly after registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToUserDto(savedUser))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(mapToUserDto(user))
                .build();
    }

    public UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .flatOrRoomNo(user.getFlatOrRoomNo())
                .role(user.getRole())
                .isPeerProvider(user.getIsPeerProvider())
                .isApproved(user.getIsApproved())
                .communityId(user.getCommunity().getId())
                .communityName(user.getCommunity().getName())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
