package com.community.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsDto {
    private long totalBookings;
    private long activeProviders;
    private long totalCompleted;
    private long totalUsers;
    private long requestedBookings;
    private long inProgressBookings;
}
