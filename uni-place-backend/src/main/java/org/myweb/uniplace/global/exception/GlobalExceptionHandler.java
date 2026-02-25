package org.myweb.uniplace.global.exception;

import org.myweb.uniplace.domain.payment.application.gateway.exception.PaymentGatewayException;
import org.myweb.uniplace.global.response.ApiResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException e) {
        ErrorCode ec = e.getErrorCode();
        return ResponseEntity
                .status(ec.getStatus())
                .body(ApiResponse.error(ec));
    }

    @ExceptionHandler(PaymentGatewayException.class)
    public ResponseEntity<ApiResponse<Void>> handlePaymentGateway(PaymentGatewayException e) {
        return ResponseEntity
            .status(ErrorCode.PAYMENT_GATEWAY_ERROR.getStatus())
            .body(ApiResponse.error(ErrorCode.PAYMENT_GATEWAY_ERROR));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity
            .status(ErrorCode.BAD_REQUEST.getStatus())
            .body(ApiResponse.error(ErrorCode.BAD_REQUEST, safeMessage(e.getMessage())));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e) {
        return ResponseEntity
            .status(ErrorCode.INTERNAL_ERROR.getStatus())
            .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        String message = firstFieldErrorMessage(e.getBindingResult().getFieldErrors());
        return ResponseEntity
            .status(ErrorCode.BAD_REQUEST.getStatus())
            .body(ApiResponse.error(ErrorCode.BAD_REQUEST, message));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> handleBindException(BindException e) {
        String message = firstFieldErrorMessage(e.getFieldErrors());
        return ResponseEntity
            .status(ErrorCode.BAD_REQUEST.getStatus())
            .body(ApiResponse.error(ErrorCode.BAD_REQUEST, message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
        String message = "요청 본문(JSON) 형식 또는 타입이 올바르지 않습니다.";
        return ResponseEntity
            .status(ErrorCode.BAD_REQUEST.getStatus())
            .body(ApiResponse.error(ErrorCode.BAD_REQUEST, message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        String message = rootMessage(e).toLowerCase();

        if (message.contains("uq_users_email") || message.contains("user_email")) {
            return ResponseEntity
                .status(ErrorCode.DUPLICATE_EMAIL.getStatus())
                .body(ApiResponse.error(ErrorCode.DUPLICATE_EMAIL));
        }
        if (message.contains("uq_users_tel") || message.contains("user_tel")) {
            return ResponseEntity
                .status(ErrorCode.DUPLICATE_TEL.getStatus())
                .body(ApiResponse.error(ErrorCode.DUPLICATE_TEL));
        }

        return ResponseEntity
            .status(ErrorCode.BAD_REQUEST.getStatus())
            .body(ApiResponse.error(ErrorCode.BAD_REQUEST, safeMessage(rootMessage(e))));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e) {
        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getStatus())
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR));
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage() == null ? "" : current.getMessage();
    }

    private String safeMessage(String message) {
        if (message == null || message.isBlank()) {
            return ErrorCode.BAD_REQUEST.getMessage();
        }
        if (message.length() > 200) {
            return message.substring(0, 200);
        }
        return message;
    }

    private String firstFieldErrorMessage(java.util.List<FieldError> fieldErrors) {
        if (fieldErrors == null || fieldErrors.isEmpty()) {
            return ErrorCode.BAD_REQUEST.getMessage();
        }
        FieldError first = fieldErrors.get(0);
        String defaultMessage = first.getDefaultMessage();
        if (defaultMessage != null && !defaultMessage.isBlank()) {
            return first.getField() + ": " + defaultMessage;
        }
        return first.getField() + " 값이 올바르지 않습니다.";
    }
}
