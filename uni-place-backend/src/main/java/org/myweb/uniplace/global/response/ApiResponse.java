package org.myweb.uniplace.global.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String code;
    private final String message;
    private final T data;

    private ApiResponse(boolean success, String code, String message, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // ✅ 성공(데이터 있음)
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", "success", data);
    }

    // ✅ 성공(데이터 없음)
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, "OK", "success", null);
    }

    // ✅ 생성(필요하면)
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, "CREATED", "created", data);
    }

    // ✅ 실패(필요하면)
    public static ApiResponse<Void> fail(String code, String message) {
        return new ApiResponse<>(false, code, message, null);
    }

    public static <T> ApiResponse<T> fail(String code, String message, T data) {
        return new ApiResponse<>(false, code, message, data);
    }
}
