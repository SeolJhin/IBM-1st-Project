package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse me(String userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Override
    public UserResponse updateMe(String userId, UserUpdateRequest req) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (req.getUserTel() != null && !req.getUserTel().isBlank()) {
            if (userRepository.existsByUserTel(req.getUserTel())
                    && !req.getUserTel().equals(user.getUserTel())) {
                throw new BusinessException(ErrorCode.DUPLICATE_TEL);
            }
            user.changeTel(req.getUserTel());
        }

        return UserResponse.from(user);
    }

    @Override
    public void deleteMe(String userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeDeleteYn("Y");
    }
}
