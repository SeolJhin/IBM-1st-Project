//// 경로: org/myweb/uniplace/domain/property/application/RoomService.java
//package org.myweb.uniplace.domain.property.application;
//
//import org.myweb.uniplace.domain.property.api.dto.request.RoomCreateRequest;
//import org.myweb.uniplace.domain.property.api.dto.request.RoomSearchRequest;
//import org.myweb.uniplace.domain.property.api.dto.request.RoomUpdateRequest;
//import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
//import org.myweb.uniplace.domain.property.api.dto.response.RoomSummaryResponse;
//import org.myweb.uniplace.global.response.PageResponse;
//
//import org.springframework.data.domain.Pageable;
//
//public interface RoomService {
//
//    RoomDetailResponse getRoom(Integer roomId);
//    RoomDetailResponse getRoomForAdmin(Integer roomId);
//
//    // ✅ 페이징 + 필터
//    PageResponse<RoomSummaryResponse> search(RoomSearchRequest request, Pageable pageable);
//
//    // ✅ 관리자 전용
//    RoomDetailResponse createRoom(RoomCreateRequest request);
//    RoomDetailResponse updateRoom(Integer roomId, RoomUpdateRequest request);
//}