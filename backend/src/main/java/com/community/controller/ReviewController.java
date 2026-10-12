package com.community.controller;

import com.community.config.UserPrincipal;
import com.community.dto.ReviewDto;
import com.community.dto.ReviewRequest;
import com.community.exception.AppException;
import com.community.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('RESIDENT')")
    public ResponseEntity<ReviewDto> submitReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ReviewRequest request) {
        if (request.getBookingId() == null) {
            throw new AppException("Booking ID is required in review payload", HttpStatus.BAD_REQUEST);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.addReview(currentUser, request.getBookingId(), request));
    }
}
