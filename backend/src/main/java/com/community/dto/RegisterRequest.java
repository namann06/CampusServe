package com.community.dto;

import com.community.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    private String phone;

    @NotBlank(message = "Flat or room number is required")
    private String flatOrRoomNumber;

    @NotNull(message = "Role is required (ROLE_RESIDENT or ROLE_PROVIDER)")
    private Role role;

    @NotBlank(message = "Community passcode is required")
    private String communityPasscode;

    @Builder.Default
    private Boolean isPeerProvider = false;
}
