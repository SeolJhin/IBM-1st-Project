// 경로: org/myweb/uniplace/domain/property/application/RoomService.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.RoomCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoomService {

    RoomDetailResponse getRoom(Integer roomId);
    RoomDetailResponse getRoomForAdmin(Integer roomId);

    Page<RoomSummaryResponse> searchPage(RoomSearchRequest request, Pageable pageable);

    RoomDetailResponse createRoom(RoomCreateRequest request);
    RoomDetailResponse updateRoom(Integer roomId, RoomUpdateRequest request);
}