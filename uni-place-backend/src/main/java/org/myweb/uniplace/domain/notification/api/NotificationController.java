// 경로: org/myweb/uniplace/domain/notification/api/NotificationController.java
package org.myweb.uniplace.domain.notification.api;

import org.myweb.uniplace.domain.notification.api.dto.request.MarkNotificationReadRequest;
import org.myweb.uniplace.domain.notification.api.dto.response.NotificationListResponse;
import org.myweb.uniplace.domain.notification.application.NotificationService;
import org.myweb.uniplace.global.response.ApiResponse;
import org.myweb.uniplace.global.security.AuthUser;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationListResponse> my(
            @AuthenticationPrincipal AuthUser me,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ApiResponse.ok(notificationService.my(me.getUserId(), pageable));
    }

    @GetMapping("/unread")
    public ApiResponse<NotificationListResponse> myUnread(
            @AuthenticationPrincipal AuthUser me,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ApiResponse.ok(notificationService.myUnread(me.getUserId(), pageable));
    }

    @PatchMapping("/read")
    public ApiResponse<Void> markRead(
            @AuthenticationPrincipal AuthUser me,
            @Valid @RequestBody MarkNotificationReadRequest req
    ) {
        notificationService.markRead(me.getUserId(), req.getNotificationId());
        return ApiResponse.ok();
    }

    @PatchMapping("/read-all")
    public ApiResponse<Integer> markAllRead(@AuthenticationPrincipal AuthUser me) {
        return ApiResponse.ok(notificationService.markAllRead(me.getUserId()));
    }
}