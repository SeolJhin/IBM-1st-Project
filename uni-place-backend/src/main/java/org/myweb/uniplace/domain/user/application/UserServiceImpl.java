package org.myweb.uniplace.domain.user.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.domain.notification.domain.enums.NotificationType;
import org.myweb.uniplace.domain.notification.domain.enums.TargetType;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserRoleUpdateRequest;
import org.myweb.uniplace.domain.user.api.admin.dto.request.AdminUserStatusUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.request.UserUpdateRequest;
import org.myweb.uniplace.domain.user.api.dto.response.UserResponse;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.user.domain.enums.UserRole;
import org.myweb.uniplace.domain.user.repository.UserRepository;
import org.myweb.uniplace.global.exception.BusinessException;
import org.myweb.uniplace.global.exception.ErrorCode;
import org.myweb.uniplace.global.security.AuthUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private static final int ADMIN_BULK_CHANGE_THRESHOLD = 20;
    private static final long ADMIN_BULK_CHANGE_WINDOW_MINUTES = 10L;
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, Deque<LocalDateTime>> ADMIN_CHANGE_WINDOWS = new ConcurrentHashMap<>();


    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

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

        boolean emailChanged = false;
        boolean telChanged = false;
        boolean pwdChanged = false;

        String newEmail = normalizeEmail(req.getUserEmail());
        if (hasText(newEmail)) {
            String currentEmail = normalizeEmail(user.getUserEmail());
            if (currentEmail == null || !newEmail.equals(currentEmail)) {
                if (userRepository.existsByUserEmail(newEmail)) {
                    throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
                }
                user.changeEmail(newEmail);
                emailChanged = true;
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
                telChanged = true;
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
            pwdChanged = true;
        }

        notifyIfChanged(user, emailChanged, telChanged, pwdChanged);

        return UserResponse.from(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> listForAdmin(Pageable pageable, UserRole role) {
    	Page<User> page = (role == null)
                ? userRepository.findAll(pageable)
                : userRepository.findByUserRole(role, pageable);

        return page.map(UserResponse::from);
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

        String before = user.getUserSt() == null ? "-" : user.getUserSt().name();
        user.changeStatus(req.getUserSt());
        String after = user.getUserSt() == null ? "-" : user.getUserSt().name();
        String actorAdminId = currentActorId();
        safeNotifyAdmins(
            NotificationType.ADM_USER_STATUS_CHG.name(),
            "관리자가 사용자 상태를 변경했습니다. 대상회원ID=" + user.getUserId()
                + ", 변경전=" + before
                + ", 변경후=" + after
                + ", 작업자관리자ID=" + actorAdminId,
            actorAdminId,
            "/admin/users/" + user.getUserId()
        );
        // 본인에게도 알림
        String statusMsg = switch (req.getUserSt()) {
            case banned   -> "계정이 이용 정지되었습니다. 커뮤니티 글/댓글 작성이 제한됩니다.";
            case inactive -> "계정이 비활성화되었습니다.";
            default       -> "계정이 정상 상태로 복구되었습니다.";
        };
        safeNotify(user.getUserId(), NotificationType.ADM_USER_STATUS_CHG.name(), statusMsg);
        detectBulkAdminChange(actorAdminId, "STATUS");
        return UserResponse.from(user);
    }

    @Override
    public UserResponse updateRole(String userId, AdminUserRoleUpdateRequest req) {
        if (req == null || req.getUserRole() == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String before = user.getUserRole() == null ? "-" : user.getUserRole().name();
        user.changeRole(req.getUserRole());
        String after = user.getUserRole() == null ? "-" : user.getUserRole().name();
        String actorAdminId = currentActorId();
        safeNotifyAdmins(
            NotificationType.ADM_USER_ROLE_CHG.name(),
            "관리자가 사용자 권한을 변경했습니다. 대상회원ID=" + user.getUserId()
                + ", 변경전=" + before
                + ", 변경후=" + after
                + ", 작업자관리자ID=" + actorAdminId,
            actorAdminId,
            "/admin/users/" + user.getUserId()
        );
        detectBulkAdminChange(actorAdminId, "ROLE");
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

    private void notifyIfChanged(User user, boolean emailChanged, boolean telChanged, boolean pwdChanged) {
        if (user == null || !hasText(user.getUserId())) {
            return;
        }
        if (emailChanged) {
            safeNotify(user.getUserId(), NotificationType.SEC_EMAIL_CHG.name(), "이메일이 변경되었습니다.");
        }
        if (telChanged) {
            safeNotify(user.getUserId(), NotificationType.SEC_TEL_CHG.name(), "전화번호가 변경되었습니다.");
        }
        if (pwdChanged) {
            safeNotify(user.getUserId(), NotificationType.SEC_PWD_CHG.name(), "비밀번호가 변경되었습니다.");
        }
    }

    private void safeNotify(String userId, String code, String message) {
        try {
            notificationService.notifyUser(
                userId,
                code,
                message,
                null,
                TargetType.notice,
                null,
                "/mypage/security"
            );
        } catch (Exception e) {
            log.warn("[USER][NOTIFY] failed userId={} code={} reason={}", userId, code, e.getMessage());
        }
    }

    private void safeNotifyAdmins(String code, String message, String senderId, String urlPath) {
        try {
            notificationService.notifyAdmins(
                code,
                message,
                senderId,
                TargetType.notice,
                null,
                urlPath
            );
        } catch (Exception e) {
            log.warn("[USER][NOTIFY][ADMIN] failed code={} reason={}", code, e.getMessage());
        }
    }

    private void detectBulkAdminChange(String actorAdminId, String changeType) {
        if (!hasText(actorAdminId)) {
            return;
        }
        Deque<LocalDateTime> window = ADMIN_CHANGE_WINDOWS.computeIfAbsent(actorAdminId, k -> new ArrayDeque<>());
        LocalDateTime now = LocalDateTime.now();
        synchronized (window) {
            LocalDateTime start = now.minusMinutes(ADMIN_BULK_CHANGE_WINDOW_MINUTES);
            while (!window.isEmpty() && window.peekFirst().isBefore(start)) {
                window.pollFirst();
            }
            window.addLast(now);
            if (window.size() < ADMIN_BULK_CHANGE_THRESHOLD) {
                return;
            }
            // Suppress duplicate alerts for same burst.
            window.clear();
        }

        safeNotifyAdmins(
            NotificationType.ADM_BULK_USER_CHANGE.name(),
            "대량 사용자 변경이 감지되었습니다. 작업자관리자ID=" + actorAdminId
                + ", 변경유형=" + changeType
                + ", 임계치=" + ADMIN_BULK_CHANGE_THRESHOLD
                + ", 감지구간(분)=" + ADMIN_BULK_CHANGE_WINDOW_MINUTES
                + ", 감지시각=" + LocalDateTime.now().format(TS_FMT),
            actorAdminId,
            "/admin/users"
        );
    }

    private String currentActorId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
            ? null
            : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof AuthUser authUser) {
            return authUser.getUserId();
        }
        return "admin";
    }
}
