package com.community.service;

import com.community.config.UserPrincipal;
import com.community.dto.BookingDto;
import com.community.dto.BookingRequest;
import com.community.dto.ReviewDto;
import com.community.dto.ReviewRequest;
import com.community.dto.VerifyOtpRequest;
import com.community.entity.*;
import com.community.exception.AppException;
import com.community.repository.BookingRepository;
import com.community.repository.ReviewRepository;
import com.community.repository.ServiceRepository;
import com.community.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public BookingDto createBooking(UserPrincipal currentUser, BookingRequest request) {
        User resident = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new AppException("Service not found with id: " + request.getServiceId(), HttpStatus.NOT_FOUND));

        // Tenant isolation: Check service belongs to resident's community
        if (!service.getCommunity().getId().equals(currentUser.getCommunityId())) {
            throw new AppException("Cannot book services outside your registered community", HttpStatus.FORBIDDEN);
        }

        if (!Boolean.TRUE.equals(service.getIsAvailable())) {
            throw new AppException("This service is currently unavailable", HttpStatus.BAD_REQUEST);
        }

        // Prevent self-booking
        if (service.getProvider().getId().equals(currentUser.getId())) {
            throw new AppException("Providers cannot book their own services", HttpStatus.BAD_REQUEST);
        }

        // Generate cryptographically secure 4-digit OTP
        int otpNum = 1000 + secureRandom.nextInt(9000);
        String otp = String.valueOf(otpNum);

        Booking booking = Booking.builder()
                .community(service.getCommunity())
                .resident(resident)
                .provider(service.getProvider())
                .service(service)
                .status(BookingStatus.REQUESTED)
                .verificationOtp(otp)
                .otpAttempts(0)
                .notes(sanitizeNotes(request.getNotes()))
                .build();

        return mapToDto(bookingRepository.save(booking));
    }

    private String sanitizeNotes(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String cleaned = raw.replaceAll("(?i)<script.*?>.*?</script.*?>", "")
                            .replaceAll("<[^>]*>", "")
                            .replaceAll("[\"';]+", " ")
                            .trim();

        if (cleaned.matches("(?i).*(drop\\s+table|select\\s+.*from|insert\\s+into|delete\\s+from|union\\s+select|--|/\\*).*")) {
            throw new AppException("Invalid characters or query keywords detected in booking notes", HttpStatus.BAD_REQUEST);
        }

        if (cleaned.length() > 300) {
            cleaned = cleaned.substring(0, 300);
        }
        return cleaned;
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getMyBookings(UserPrincipal currentUser) {
        return bookingRepository.findMyBookingsInCommunity(currentUser.getCommunityId(), currentUser.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto acceptBooking(UserPrincipal currentUser, Long bookingId) {
        Booking booking = findBookingWithOwnershipCheck(bookingId, currentUser);

        if (!booking.getProvider().getId().equals(currentUser.getId())) {
            throw new AppException("Only the designated service provider can accept this booking", HttpStatus.FORBIDDEN);
        }

        if (booking.getStatus() != BookingStatus.REQUESTED) {
            throw new AppException("Booking cannot be accepted from current status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional(noRollbackFor = AppException.class)
    public BookingDto verifyStart(UserPrincipal currentUser, Long bookingId, VerifyOtpRequest request) {
        Booking booking = findBookingWithOwnershipCheck(bookingId, currentUser);

        if (!booking.getProvider().getId().equals(currentUser.getId())) {
            throw new AppException("Only the designated service provider can verify the start OTP", HttpStatus.FORBIDDEN);
        }

        if (booking.getStatus() != BookingStatus.ACCEPTED) {
            throw new AppException("Service can only be started when booking is in ACCEPTED status. Current status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        int currentAttempts = (booking.getOtpAttempts() != null ? booking.getOtpAttempts() : 0);

        // Brute-force OTP mitigation: Max 5 attempts
        if (currentAttempts >= 5) {
            throw new AppException("Security Lock: OTP attempt limit (5) exceeded. Please contact community admin to unlock this job.", HttpStatus.LOCKED);
        }

        currentAttempts++;
        booking.setOtpAttempts(currentAttempts);

        if (!booking.getVerificationOtp().equals(request.getOtp().trim())) {
            bookingRepository.save(booking);
            if (currentAttempts >= 5) {
                throw new AppException("Security Lock: OTP attempt limit reached. Booking locked for administrative review.", HttpStatus.LOCKED);
            }
            int remaining = 5 - currentAttempts;
            throw new AppException("Invalid OTP code. " + remaining + " attempt(s) remaining.", HttpStatus.BAD_REQUEST);
        }

        // OTP verified successfully: Handshake handover complete
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setStartedAt(LocalDateTime.now());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingDto completeBooking(UserPrincipal currentUser, Long bookingId) {
        Booking booking = findBookingWithOwnershipCheck(bookingId, currentUser);

        if (!booking.getProvider().getId().equals(currentUser.getId())) {
            throw new AppException("Only the designated service provider can mark this booking complete", HttpStatus.FORBIDDEN);
        }

        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new AppException("Booking cannot be marked complete from status: " + booking.getStatus(), HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        return mapToDto(bookingRepository.save(booking));
    }

    @Transactional
    public ReviewDto addReview(UserPrincipal currentUser, Long bookingId, ReviewRequest request) {
        Booking booking = findBookingWithOwnershipCheck(bookingId, currentUser);

        if (!booking.getResident().getId().equals(currentUser.getId())) {
            throw new AppException("Only the booking resident can submit a review", HttpStatus.FORBIDDEN);
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new AppException("Reviews can only be submitted for COMPLETED bookings", HttpStatus.BAD_REQUEST);
        }

        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new AppException("A review has already been submitted for this booking", HttpStatus.CONFLICT);
        }

        Review review = Review.builder()
                .booking(booking)
                .rating(request.getRating())
                .comment(request.getComment() != null ? request.getComment().trim() : "")
                .build();

        Review savedReview = reviewRepository.save(review);
        booking.setReview(savedReview);

        return mapReviewToDto(savedReview);
    }

    private Booking findBookingWithOwnershipCheck(Long bookingId, UserPrincipal currentUser) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new AppException("Booking not found with id: " + bookingId, HttpStatus.NOT_FOUND));

        // Strict Tenant Isolation
        if (!booking.getCommunity().getId().equals(currentUser.getCommunityId())) {
            throw new AppException("Access denied: Tenant boundary violation", HttpStatus.FORBIDDEN);
        }

        // BOLA / IDOR checks
        boolean isResident = booking.getResident().getId().equals(currentUser.getId());
        boolean isProvider = booking.getProvider().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isResident && !isProvider && !isAdmin) {
            throw new AppException("Access denied: You do not own this booking", HttpStatus.FORBIDDEN);
        }

        return booking;
    }

    public BookingDto mapToDto(Booking booking) {
        ReviewDto reviewDto = null;
        if (booking.getReview() != null) {
            reviewDto = mapReviewToDto(booking.getReview());
        }

        return BookingDto.builder()
                .id(booking.getId())
                .communityId(booking.getCommunity().getId())
                .serviceId(booking.getService().getId())
                .serviceTitle(booking.getService().getTitle())
                .serviceCategory(booking.getService().getCategory())
                .basePrice(booking.getService().getBasePrice())
                .residentId(booking.getResident().getId())
                .residentName(booking.getResident().getName())
                .residentFlat(booking.getResident().getFlatOrRoomNo())
                .residentPhone(booking.getResident().getPhone())
                .providerId(booking.getProvider().getId())
                .providerName(booking.getProvider().getName())
                .providerFlat(booking.getProvider().getFlatOrRoomNo())
                .providerPhone(booking.getProvider().getPhone())
                .status(booking.getStatus())
                .verificationOtp(booking.getVerificationOtp())
                .otpAttempts(booking.getOtpAttempts())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .startedAt(booking.getStartedAt())
                .completedAt(booking.getCompletedAt())
                .review(reviewDto)
                .build();
    }

    public ReviewDto mapReviewToDto(Review review) {
        return ReviewDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
