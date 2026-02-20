package org.myweb.uniplace.domain.payment.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "payment_intent",
    indexes = {
        @Index(name = "ix_payment_intent_payment", columnList = "payment_id"),
        @Index(name = "ix_payment_intent_ref", columnList = "provider_ref_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_payment_intent_payment_ref",
            columnNames = {"payment_id", "provider_ref_id"}
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentIntent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_intent_id")
    private Long paymentIntentId;

    /**
     * FK(payment.payment_id)
     * - 실무적으로는 ManyToOne으로 잡는게 조회/조인에 편한데,
     *   너 프로젝트가 "ID 필드 유지" 스타일이면 아래처럼 Integer로만 두는 것도 OK.
     * - 여기서는 "중복/의존 최소"를 위해 paymentId만 들고감.
     */
    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Column(name = "intent_st", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentIntentStatus intentSt;

    @Column(name = "provider_ref_id", length = 100)
    private String providerRefId;

    @Column(name = "app_scheme_url", length = 2000)
    private String appSchemeUrl;

    @Column(name = "return_url", length = 1000)
    private String returnUrl;

    /**
     * JSON 컬럼들
     * - MySQL 8 JSON은 JPA가 기본으로 매핑해주지 않아서
     *   가장 실무적인 최소 구현: LONGTEXT + columnDefinition="json"
     * - 어차피 조회/검색은 잘 안하고 "원본 저장"이 목적이라 String으로 저장하는게 흔함
     */
    @Column(name = "returned_params_json", columnDefinition = "json")
    private String returnedParamsJson;

    @Column(name = "pg_ready_json", columnDefinition = "json")
    private String pgReadyJson;

    @Column(name = "pg_approve_json", columnDefinition = "json")
    private String pgApproveJson;

    @Column(name = "fail_code", length = 20)
    private String failCode;

    @Column(name = "fail_message", length = 255)
    private String failMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /* =========================
     * domain methods (실무 최소)
     * ========================= */

    public void markReadyOk(String providerRefId, String appSchemeUrl, String pgReadyJson) {
        this.intentSt = PaymentIntentStatus.READY_OK;
        this.providerRefId = providerRefId;
        this.appSchemeUrl = appSchemeUrl;
        this.pgReadyJson = pgReadyJson;
    }

    public void markReadyFail(String failCode, String failMessage, String pgReadyJson) {
        this.intentSt = PaymentIntentStatus.READY_FAIL;
        this.failCode = failCode;
        this.failMessage = failMessage;
        this.pgReadyJson = pgReadyJson;
    }

    public void markReturned(String returnedParamsJson) {
        this.intentSt = PaymentIntentStatus.RETURNED;
        this.returnedParamsJson = returnedParamsJson;
    }

    public void markApproveOk(String pgApproveJson) {
        this.intentSt = PaymentIntentStatus.APPROVE_OK;
        this.pgApproveJson = pgApproveJson;
    }

    public void markApproveFail(String failCode, String failMessage, String pgApproveJson) {
        this.intentSt = PaymentIntentStatus.APPROVE_FAIL;
        this.failCode = failCode;
        this.failMessage = failMessage;
        this.pgApproveJson = pgApproveJson;
    }

    public void markCanceled() {
        this.intentSt = PaymentIntentStatus.CANCELED;
    }
}