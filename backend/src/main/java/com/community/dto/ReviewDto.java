package com.community.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDto {
    private Long id;
    private Long bookingId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
