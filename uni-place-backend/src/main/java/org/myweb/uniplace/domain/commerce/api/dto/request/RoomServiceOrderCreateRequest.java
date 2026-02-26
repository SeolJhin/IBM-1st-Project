package org.myweb.uniplace.domain.commerce.api.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 룸서비스 주문 생성 요청 DTO
 *
 * totalPrice 제거 이유:
 *   RoomServiceOrderServiceImpl에서 parentOrder.getTotalPrice()를 자동으로 복사하므로
 *   클라이언트에서 totalPrice를 받을 필요 없음. (기존 필드는 사용되지 않던 dead code)
 */
@Getter
@NoArgsConstructor
public class RoomServiceOrderCreateRequest {

    /**
     * 부모 Order ID (선택)
     * - null이면 서비스에서 빈 Order를 자동 생성
     * - 값이 있으면 해당 Order의 totalPrice를 자동으로 복사
     */
    private Integer orderId;

    /**
     * 배달 받을 방 ID (필수)
     */
    private Integer roomId;

    /**
     * 요청사항 / 배달 메모 (선택)
     */
    private String roomServiceDesc;
}
