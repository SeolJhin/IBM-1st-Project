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

    SpaceDetailResponse getSpace(Integer spaceId);

    Page<SpaceResponse> searchPage(SpaceSearchRequest request, Pageable pageable);

    SpaceDetailResponse createSpace(SpaceCreateRequest request);

    SpaceDetailResponse updateSpace(Integer spaceId, SpaceUpdateRequest request);

    void deleteSpace(Integer spaceId);
}