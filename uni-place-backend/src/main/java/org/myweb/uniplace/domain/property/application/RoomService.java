// 경로: org/myweb/uniplace/domain/property/application/RoomService.java
package org.myweb.uniplace.domain.property.application;

import org.myweb.uniplace.domain.property.api.dto.request.RoomCreateRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
import org.myweb.uniplace.domain.property.api.dto.request.RoomUpdateRequest;
import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
import org.myweb.uniplace.domain.property.domain.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoomService {

    // 일반 사용자: 삭제된 방 제외
    RoomDetailResponse getRoom(Integer roomId);

    // 관리자: 삭제된 방도 조회 가능
    RoomDetailResponse getRoomForAdmin(Integer roomId);

    Page<RoomSummaryResponse> searchPage(RoomSearchRequest request, Pageable pageable);

    RoomDetailResponse createRoom(RoomCreateRequest request);
    RoomDetailResponse updateRoom(Integer roomId, RoomUpdateRequest request);

    void changeRoomStatus(Integer roomId, RoomStatus roomStatus);

    // ✅ soft delete
    void deleteRoom(Integer roomId);
}
