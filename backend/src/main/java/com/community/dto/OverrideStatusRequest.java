package com.community.dto;

import com.community.entity.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverrideStatusRequest {

    @NotNull(message = "Status is required (CANCELLED or COMPLETED)")
    private BookingStatus status;
}
