// features/reservation/utils/reservationErrors.js
// 백엔드 ErrorCode → 사용자 메세지 매핑

const TOUR_ERROR_MAP = {
  TOUR_RSV_404: '방문 예약을 찾을 수 없습니다.',
  TOUR_RSV_400_1: '예약 시간이 올바르지 않습니다.',
  TOUR_RSV_400_2: '예약 슬롯이 올바르지 않습니다.',
  TOUR_RSV_400_3: '현재 예약이 불가능한 방 상태입니다.',
  TOUR_RSV_409_1: '이미 예약된 시간대와 겹칩니다. 다른 시간을 선택해주세요.',
  TOUR_RSV_409_2: '동일한 연락처로 이미 예약이 존재합니다.',
  TOUR_RSV_400_4: '이미 취소된 예약입니다.',
  TOUR_RSV_400_5: '취소할 수 없는 예약 상태입니다.',
  TOUR_RSV_400_6: '방이 해당 건물에 속하지 않습니다.',
  BUILDING_404: '선택한 건물을 찾을 수 없습니다.',
  ROOM_404: '선택한 방을 찾을 수 없습니다.',
};

const SPACE_ERROR_MAP = {
  SPACE_RSV_404: '공용공간 예약을 찾을 수 없습니다.',
  SPACE_RSV_400_1: '예약 시간이 올바르지 않습니다.',
  SPACE_RSV_400_2: '예약 슬롯이 올바르지 않습니다.',
  SPACE_RSV_400_3: '예약 인원이 올바르지 않습니다.',
  SPACE_RSV_409: '이미 예약된 시간대와 겹칩니다. 다른 시간을 선택해주세요.',
  SPACE_RSV_400_4: '취소할 수 없는 예약 상태입니다.',
  SPACE_RSV_403: '해당 예약에 접근 권한이 없습니다.',
  SPACE_RSV_403_1: '입주자만 공용공간을 예약할 수 있습니다.',
  SPACE_RSV_403_2: '비활성 상태의 계정은 예약할 수 없습니다.',
  BUILDING_404: '선택한 건물을 찾을 수 없습니다.',
  SPACE_404: '선택한 공용공간을 찾을 수 없습니다.',
};

export function tourErrorMessage(
  e,
  fallback = '예약 처리 중 오류가 발생했습니다.'
) {
  const code = e?.errorCode || '';
  const msg = e?.message || '';
  return TOUR_ERROR_MAP[code] || msg || fallback;
}

export function spaceErrorMessage(
  e,
  fallback = '예약 처리 중 오류가 발생했습니다.'
) {
  const code = e?.errorCode || '';
  const msg = e?.message || '';
  return SPACE_ERROR_MAP[code] || msg || fallback;
}
