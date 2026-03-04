package org.myweb.uniplace.domain.user.application;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 이메일 인증코드를 인메모리로 관리하는 저장소.
 * - DB 테이블 불필요
 * - 서버 재시작 시 초기화됨 (짧은 유효기간이라 실용상 문제 없음)
 */
@Component
public class EmailVerificationStore {

    private static final long CODE_EXPIRE_MINUTES = 10L;
    private static final long RESEND_COOLDOWN_SECONDS = 60L; // 재발송 쿨타임

    private record Entry(String code, LocalDateTime expiresAt, boolean verified, LocalDateTime sentAt) {}

    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();

    /**
     * 인증코드 저장.
     * 이전 발송 후 60초 이내이면 예외 발생.
     */
    public void save(String email, String code) {
        String key = email.toLowerCase();
        Entry existing = store.get(key);

        // 쿨타임 체크: 이전 발송이 있고 아직 만료 전이며 60초 이내면 거부
        if (existing != null && !existing.expiresAt().isBefore(LocalDateTime.now())) {
            long secondsSinceSent = Duration.between(existing.sentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceSent < RESEND_COOLDOWN_SECONDS) {
                long remaining = RESEND_COOLDOWN_SECONDS - secondsSinceSent;
                throw new IllegalStateException("COOLDOWN:" + remaining);
            }
        }

        store.put(
            key,
            new Entry(code, LocalDateTime.now().plusMinutes(CODE_EXPIRE_MINUTES), false, LocalDateTime.now())
        );
    }

    /**
     * 코드 검증 후 verified 상태로 업데이트.
     * @return true = 검증 성공, false = 코드 불일치 or 만료
     */
    public boolean verify(String email, String inputCode) {
        String key = email.toLowerCase();
        Entry entry = store.get(key);
        if (entry == null) return false;
        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
            store.remove(key);
            return false;
        }
        if (!entry.code().equals(inputCode)) return false;

        // 검증 성공 → verified 상태로 교체 (가입 완료까지 30분 유지)
        store.put(
            key,
            new Entry(entry.code(), LocalDateTime.now().plusMinutes(30), true, entry.sentAt())
        );
        return true;
    }

    /** 가입 시 인증 완료 여부 확인 */
    public boolean isVerified(String email) {
        String key = email.toLowerCase();
        Entry entry = store.get(key);
        if (entry == null) return false;
        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
            store.remove(key);
            return false;
        }
        return entry.verified();
    }

    /** 가입 완료 후 항목 제거 */
    public void remove(String email) {
        store.remove(email.toLowerCase());
    }
}
