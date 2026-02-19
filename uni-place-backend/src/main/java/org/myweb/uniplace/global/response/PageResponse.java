package org.myweb.uniplace.global.response;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int page,             // 1-base
        int size,            // 한 페이지에 출력할 목록 갯수
        long totalElements,      // 총 목록 수
        int totalPages         // ceil(totalElements / size) 로 계산한 총 페이지 수   
) {}
