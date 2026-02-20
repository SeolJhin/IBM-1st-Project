package org.myweb.uniplace.domain.payment.domain.entity;

public enum PaymentIntentStatus {
    CREATED,
    READY_OK,
    READY_FAIL,
    RETURNED,
    APPROVE_OK,
    APPROVE_FAIL,
    CANCELED
}