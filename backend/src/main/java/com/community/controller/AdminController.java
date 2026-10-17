package com.community.controller;

import com.community.config.UserPrincipal;
import com.community.dto.AdminStatsDto;
import com.community.dto.BookingDto;
import com.community.dto.OverrideStatusRequest;
import com.community.dto.UserDto;
import com.community.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(adminService.getStats(currentUser));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> getAllBookings(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(adminService.getAllCommunityBookings(currentUser));
    }

    @PatchMapping("/bookings/{id}/override")
    public ResponseEntity<BookingDto> overrideBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody OverrideStatusRequest request) {
        return ResponseEntity.ok(adminService.overrideBookingStatus(currentUser, id, request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getCommunityUsers(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(adminService.getCommunityUsers(currentUser));
    }
}
