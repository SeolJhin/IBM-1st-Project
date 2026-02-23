package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse me(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Override
    public UserResponse updateMe(String userId, UserUpdateRequest req) {
        if (req == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String newEmail = normalizeEmail(req.getUserEmail());
        if (hasText(newEmail)) {
            String currentEmail = normalizeEmail(user.getUserEmail());
            if (currentEmail == null || !newEmail.equals(currentEmail)) {
                if (userRepository.existsByUserEmail(newEmail)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
                }
                user.changeEmail(newEmail);
            }
        }

        String newTel = normalizeTel(req.getUserTel());
        if (hasText(newTel)) {
            String currentTel = normalizeTel(user.getUserTel());
            if (currentTel == null || !newTel.equals(currentTel)) {
                if (userRepository.existsByUserTel(newTel)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_TEL);
                }
                user.changeTel(newTel);
            }
        }

        String newPwd = req.getUserPwd();
        if (hasText(newPwd)) {
            String currentPwd = req.getCurrentUserPwd();
            if (!hasText(currentPwd)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST);
            }
            if (!passwordEncoder.matches(currentPwd, user.getUserPwd())) {
                throw new BusinessException(ErrorCode.INVALID_PASSWORD);
            }
            user.changePwd(passwordEncoder.encode(newPwd));
        }

        return UserResponse.from(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getByIdForAdmin(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    @Override
    public UserResponse updateStatus(String userId, AdminUserStatusUpdateRequest req) {
        if (req == null || req.getUserSt() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changeStatus(req.getUserSt());
        return UserResponse.from(user);
    }

    @Override
    public UserResponse updateRole(String userId, AdminUserRoleUpdateRequest req) {
        if (req == null || req.getUserRole() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changeRole(req.getUserRole());
        return UserResponse.from(user);
    }

    @Override
    public void deleteMe(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeDeleteYN("Y");
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private static String normalizeTel(String tel) {
        if (tel == null) {
            return null;
        }
        return tel.trim();
    }
}
