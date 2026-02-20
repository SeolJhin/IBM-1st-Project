package org.myweb.uniplace.global.response;

import org.springframework.data.domain.Page;
import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int page,              // 1-base
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber() + 1,   // 너는 1-base로 쓰고 있으니까 +1
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}