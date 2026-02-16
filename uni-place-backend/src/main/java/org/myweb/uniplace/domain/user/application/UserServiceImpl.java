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

        // 엔티티에 setter가 없으니, 필요하면 User에 변경 메서드 추가하거나 @Setter 사용
        // 여기서는 간단히 리플렉션/세터 없이 가려면 User 엔티티에 changeName/changeTel 메서드를 추가하는 게 정석.
        // 예시로는 update를 최소화하자:
        if (req.getUserName() != null) {
            // user.changeName(req.getUserName());
            throw new BusinessException(ErrorCode.NOT_IMPLEMENTED);
        }
        if (req.getUserTel() != null) {
            throw new BusinessException(ErrorCode.NOT_IMPLEMENTED);
        }
        return UserResponse.from(user);
    }

    @Override
    public void softDeleteMe(String userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        // user.softDelete();  (User 엔티티에 이미 있음)
        user.softDelete();
    }
}
