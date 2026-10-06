package com.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyOtpRequest {

    @NotBlank(message = "OTP is required")
    @Pattern(regexp = "^[0-9]{4}$", message = "OTP must be exactly 4 numeric digits")
    private String otp;
}
