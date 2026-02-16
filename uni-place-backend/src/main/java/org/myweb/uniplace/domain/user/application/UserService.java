package org.myweb.uniplace.domain.user.application;

import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;

public interface UserService {
    UserResponse me(String userId);
    UserResponse updateMe(String userId, UserUpdateRequest req);
    void deleteMe(String userId);
}
