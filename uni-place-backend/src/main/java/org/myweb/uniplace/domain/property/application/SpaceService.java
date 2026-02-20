// 경로: org/myweb/uniplace/domain/property/application/SpaceService.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.SpaceCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.SpaceUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.SpaceResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SpaceService {

    // 단건 조회
    SpaceDetailResponse getSpace(Integer spaceId);

    // 목록 조회
    Page<SpaceResponse> searchPage(SpaceSearchRequest request, Pageable pageable);

    // 생성
    SpaceDetailResponse createSpace(SpaceCreateRequest request);

    // 수정
    SpaceDetailResponse updateSpace(Integer spaceId, SpaceUpdateRequest request);

    // 삭제 (소프트/하드 여부는 구현에서 결정)
    void deleteSpace(Integer spaceId);
}