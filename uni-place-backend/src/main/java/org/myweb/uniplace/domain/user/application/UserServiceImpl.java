package org.myweb.uniplace.domain.user.application;

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

import lombok.RequiredArgsConstructor;

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // ✅ 이메일 변경
        String newEmail = req.getUserEmail();
        if (newEmail != null && !newEmail.isBlank()) {
            String currentEmail = user.getUserEmail();
            if (currentEmail == null || !newEmail.equals(currentEmail)) {

                // 다른 계정이 이미 쓰는 이메일인지 체크
                if (userRepository.existsByUserEmail(newEmail)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
                }

                user.changeEmail(newEmail); // ✅ 엔티티 메서드 필요(아래 참고)
            }
        }
        
        String newTel = req.getUserTel();
        if (newTel != null && !newTel.isBlank()) {
            String currentTel = user.getUserTel();
            if (currentTel == null || !newTel.equals(currentTel)) {
                if (userRepository.existsByUserTel(newTel)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_TEL);
                }
                user.changeTel(newTel);
            }
        }
        
        // ✅ 비밀번호 변경
        String newPwd = req.getUserPwd();
        if (newPwd != null && !newPwd.isBlank()) {
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
    
    // ✅ 관리자 - 상태 변경
    @Override
    public UserResponse updateStatus(String userId, AdminUserStatusUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changeStatus(req.getUserSt());  // ← 엔티티 메서드명에 맞춰서 조정

        return UserResponse.from(user);
    }

    // ✅ 관리자 - 권한 변경
    @Override
    public UserResponse updateRole(String userId, AdminUserRoleUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.changeRole(req.getUserRole()); // ← 엔티티 메서드명에 맞춰서 조정

        return UserResponse.from(user);
    }
    

    @Override
    public void deleteMe(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeDeleteYN("Y");
    }
    
    
    
}
