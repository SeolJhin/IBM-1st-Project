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

    @Column(name = "payment_id", nullable = false)
    private Integer paymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "intent_st", nullable = false)
    private PaymentIntentStatus intentSt;

    @Column(name = "provider_ref_id", length = 100)
    private String providerRefId;

    @Column(name = "app_scheme_url", length = 2000)
    private String appSchemeUrl;

    @Column(name = "return_url", length = 1000)
    private String returnUrl;

    @Lob
    @Column(name = "returned_params_json", columnDefinition = "json")
    private String returnedParamsJson;

    @Lob
    @Column(name = "pg_ready_json", columnDefinition = "json")
    private String pgReadyJson;

    @Lob
    @Column(name = "pg_approve_json", columnDefinition = "json")
    private String pgApproveJson;

    @Column(name = "fail_code", length = 20)
    private String failCode;

    @Column(name = "fail_message", length = 255)
    private String failMessage;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

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