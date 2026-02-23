package org.myweb.uniplace.domain.user.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequest {

    @Email(message = "Invalid email format.")
    private String userEmail;

    private String userTel;

    @Size(min = 8, message = "Current password must be at least 8 characters.")
    private String currentUserPwd;

    @Size(min = 8, message = "New password must be at least 8 characters.")
    private String userPwd;
}
