package com.community.controller;

import com.community.config.UserPrincipal;
import com.community.dto.BookingDto;
import com.community.dto.BookingRequest;
import com.community.dto.ReviewDto;
import com.community.dto.ReviewRequest;
import com.community.dto.VerifyOtpRequest;
import com.community.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<BookingDto> createBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BookingRequest request) {
        BookingDto booking = bookingService.createBooking(currentUser, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingDto>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(bookingService.getMyBookings(currentUser));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<BookingDto> acceptBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.acceptBooking(currentUser, id));
    }

    @PatchMapping("/{id}/verify-start")
    public ResponseEntity<BookingDto> verifyStart(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(bookingService.verifyStart(currentUser, id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<BookingDto> completeBooking(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.completeBooking(currentUser, id));
    }

    @PostMapping("/{id}/reviews")
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ReviewDto> submitReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.addReview(currentUser, id, request));
    }
}
