//// 경로: org/myweb/uniplace/domain/property/api/admin/AdminRoomController.java
//package org.myweb.uniplace.domain.property.api.admin;
//
//import org.myweb.uniplace.domain.property.api.dto.request.RoomCreateRequest;
//import org.myweb.uniplace.domain.property.api.dto.request.RoomUpdateRequest;
//import org.myweb.uniplace.domain.property.api.dto.response.RoomDetailResponse;
//import org.myweb.uniplace.domain.property.application.RoomService;
//import org.myweb.uniplace.global.response.ApiResponse;
//
//import org.springframework.http.MediaType;
//import org.springframework.validation.annotation.Validated;
//import org.springframework.web.bind.annotation.*;
//
//import lombok.RequiredArgsConstructor;
//
//@RestController
//@RequiredArgsConstructor
//@RequestMapping("/admin/rooms")
//public class AdminRoomController {
//
//    private final RoomService roomService;
//
//    @GetMapping("/{roomId}")
//    public ApiResponse<RoomDetailResponse> detail(@PathVariable Integer roomId) {
//        return ApiResponse.ok(roomService.getRoomForAdmin(roomId));
//    }
//
//    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public ApiResponse<RoomDetailResponse> create(@Validated @ModelAttribute RoomCreateRequest request) {
//        return ApiResponse.ok(roomService.createRoom(request));
//    }
//
//    @PutMapping(value = "/{roomId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public ApiResponse<RoomDetailResponse> update(
//            @PathVariable Integer roomId,
//            @Validated @ModelAttribute RoomUpdateRequest request
//    ) {
//        return ApiResponse.ok(roomService.updateRoom(roomId, request));
//    }
//}