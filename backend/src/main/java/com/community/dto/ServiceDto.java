package com.community.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDto {
    private Long id;
    private Long providerId;
    private String providerName;
    private String providerFlat;
    private String providerPhone;
    private Long communityId;
    private String category;
    private String title;
    private String description;
    private BigDecimal basePrice;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
}
