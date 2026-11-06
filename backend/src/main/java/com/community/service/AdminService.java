package com.community.service;

import com.community.config.UserPrincipal;
import com.community.dto.AdminStatsDto;
import com.community.dto.BookingDto;
import com.community.dto.OverrideStatusRequest;
import com.community.dto.UserDto;
import com.community.entity.Booking;
import com.community.entity.BookingStatus;
import com.community.entity.Role;
import com.community.exception.AppException;
import com.community.repository.BookingRepository;
import com.community.repository.CommunityRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final BookingService bookingService;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public AdminStatsDto getStats(UserPrincipal currentUser) {
        Long communityId = currentUser.getCommunityId();

        long totalBookings = bookingRepository.countByCommunityId(communityId);
        long activeProviders = bookingRepository.countActiveProvidersInCommunity(communityId);
        // If 0 active on bookings, count registered providers in community
        if (activeProviders == 0) {
            activeProviders = userRepository.countByCommunityIdAndRole(communityId, Role.ROLE_PROVIDER);
        }
        long completedServices = bookingRepository.countByCommunityIdAndStatus(communityId, BookingStatus.COMPLETED);
        long requested = bookingRepository.countByCommunityIdAndStatus(communityId, BookingStatus.REQUESTED);
        long inProgress = bookingRepository.countByCommunityIdAndStatus(communityId, BookingStatus.IN_PROGRESS);
        long totalUsers = userRepository.countByCommunityId(communityId);

        return AdminStatsDto.builder()
                .totalBookings(totalBookings)
                .activeProviders(activeProviders)
                .totalCompleted(completedServices)
                .totalUsers(totalUsers)
                .requestedBookings(requested)
                .inProgressBookings(inProgress)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getAllCommunityBookings(UserPrincipal currentUser) {
        return bookingRepository.findAllByCommunityIdOrderByCreatedAtDesc(currentUser.getCommunityId())
                .stream()
                .map(bookingService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto overrideBookingStatus(UserPrincipal currentUser, Long bookingId, OverrideStatusRequest request) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new AppException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        if (!booking.getCommunity().getId().equals(currentUser.getCommunityId())) {
            throw new AppException("Access denied: Tenant boundary violation", HttpStatus.FORBIDDEN);
        }

        BookingStatus newStatus = request.getStatus();
        booking.setStatus(newStatus);

        if (newStatus == BookingStatus.COMPLETED && booking.getCompletedAt() == null) {
            booking.setCompletedAt(LocalDateTime.now());
        }
        // Admin override also clears any security locks on OTP attempts
        booking.setOtpAttempts(0);

        return bookingService.mapToDto(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<UserDto> getCommunityUsers(UserPrincipal currentUser) {
        return userRepository.findByCommunityIdWithCommunity(currentUser.getCommunityId())
                .stream()
                .map(authService::mapToUserDto)
                .collect(Collectors.toList());
    }
}
