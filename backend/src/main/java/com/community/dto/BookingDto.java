package com.community.dto;

import com.community.entity.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDto {
    private Long id;
    private Long communityId;

    // Service details
    private Long serviceId;
    private String serviceTitle;
    private String serviceCategory;
    private BigDecimal basePrice;

    // Resident details
    private Long residentId;
    private String residentName;
    private String residentFlat;
    private String residentPhone;

    // Provider details
    private Long providerId;
    private String providerName;
    private String providerFlat;
    private String providerPhone;

    // State & Verification
    private BookingStatus status;
    private String verificationOtp;
    private Integer otpAttempts;
    private String notes;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    // Review
    private ReviewDto review;
}
