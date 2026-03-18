package org.myweb.uniplace.domain.user.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.myweb.uniplace.global.common.BaseTimeEntity;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Entity
@Table(name = "face_descriptor")
public class FaceDescriptor extends BaseTimeEntity {

    public static final int MAX_VECTORS = 5; // 최대 저장 벡터 수

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "face_id")
    private Long faceId;

    @Column(name = "user_id", nullable = false, unique = true, length = 50)
    private String userId;

    /**
     * 128차원 float 벡터 JSON 배열 — AES-256 암호화 후 저장
     * 형식: ["암호화된벡터1", "암호화된벡터2", ...]  최대 5개
     */
    @Column(name = "descriptor", nullable = false, columnDefinition = "TEXT")
    private String descriptor;

    @Column(name = "fail_count", nullable = false)
    @Builder.Default
    private int failCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    /* ── 비즈니스 메서드 ── */

    /** 새 벡터 추가 (최대 MAX_VECTORS개, 초과 시 가장 오래된 것 제거) */
    public void addDescriptor(String encrypted) {
        this.failCount = 0;
        this.lockedUntil = null;
        this.descriptor = encrypted; // ServiceImpl에서 배열 관리
    }

    public void updateDescriptor(String encrypted) {
        this.descriptor = encrypted;
        this.failCount = 0;
        this.lockedUntil = null;
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public void recordFailure() {
        this.failCount++;
        if (this.failCount >= 5) {
            this.lockedUntil = LocalDateTime.now().plusMinutes(10);
        }
    }

    public void resetFailure() {
        this.failCount = 0;
        this.lockedUntil = null;
    }
}