package com.community.dto;

import com.community.entity.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String flatOrRoomNo;
    private Role role;
    private Boolean isPeerProvider;
    private Boolean isApproved;
    private Long communityId;
    private String communityName;
    private LocalDateTime createdAt;
}
