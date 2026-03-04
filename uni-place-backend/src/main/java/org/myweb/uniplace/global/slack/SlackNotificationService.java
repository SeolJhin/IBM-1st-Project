// 경로: org/myweb/uniplace/global/slack/SlackNotificationService.java
package org.myweb.uniplace.global.slack;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.global.config.SlackProperties;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlackNotificationService {

    private final SlackProperties slackProperties;
    private final ObjectMapper objectMapper;

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    public void send(String message) {
        String webhookUrl = slackProperties.getWebhookUrl();

        log.info("[SLACK] send() 호출됨");
        log.info("[SLACK] webhookUrl={}", webhookUrl);

        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("[SLACK] webhook URL이 설정되지 않아 메시지를 전송하지 않습니다.");
            return;
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of("text", message));
            log.info("[SLACK] 전송 body={}", body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(body, java.nio.charset.StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(
                    request, HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                log.warn("[SLACK] 전송 실패 status={} body={}", response.statusCode(), response.body());
            } else {
                log.info("[SLACK] 전송 성공!");
            }

        } catch (Exception e) {
            log.warn("[SLACK] 전송 중 오류: {} / {}", e.getClass().getName(), e.getMessage());
        }
    }

    public void sendRoomServiceOrderAlert(String userId, Integer roomNo, Integer roomId,
                                          String desc, Integer orderId) {
        log.info("[SLACK] sendRoomServiceOrderAlert() 호출됨 orderId={}", orderId);

        String message = String.format(
                """
                🛎️ *새 룸서비스 주문이 접수되었습니다!*
                • 주문 ID : #%d
                • 사용자  : %s
                • 객실    : %s (ID: %d)
                • 요청사항 : %s
                • 관리자 페이지 : /admin/roomservice/room_orders
                """,
                orderId,
                userId,
                roomNo != null ? roomNo : "-",
                roomId != null ? roomId : 0,
                desc != null && !desc.isBlank() ? desc : "(없음)"
        );

        send(message);
    }
    
    public void sendTourReservationAlert(Integer tourId, String name, String tel, String time) {
        String message = String.format("""
            📅 *새 투어 예약이 접수되었습니다!*
            • 예약 ID  : #%d
            • 이름    : %s
            • 연락처  : %s
            • 시간    : %s
            • 관리자 페이지 : /admin/reservations/tours
            """, tourId, name, tel, time);
        send(message);
    }

    public void sendSpaceReservationAlert(Integer reservationId, String userId, String spaceName, String time) {
        String message = String.format("""
            🏢 *새 공간 예약이 접수되었습니다!*
            • 예약 ID  : #%d
            • 사용자  : %s
            • 공간    : %s
            • 시간    : %s
            • 관리자 페이지 : /admin/reservations/spaces
            """, reservationId, userId, spaceName, time);
        send(message);
    }
}
