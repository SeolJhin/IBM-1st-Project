// features/property/hooks/useRoom.js
// 객실 상세 조회
//
// [사용 예시]
// const { room, loading, error, refetch } = useRoom(roomId);
//
// [roomId가 없을 때] — roomId가 null/undefined이면 API 호출 안 함
// const { room } = useRoom(null); // room === null, loading === false
//
// RoomDetailResponse 실제 필드 (RoomDetailResponse.java 기준):
//   roomId        — 객실 ID
//   buildingId    — 소속 빌딩 ID
//   buildingNm    — 빌딩명
//   buildingAddr  — 빌딩 주소
//   buildingDesc  — 빌딩 설명
//   parkingCapacity — 주차 가능 대수
//   roomNo        — 호실 번호
//   floor         — 층수
//   roomSize      — 전용면적 (BigDecimal → number)
//   deposit       — 보증금 (BigDecimal → number)
//   rentPrice     — 월세 (BigDecimal → number)
//   manageFee     — 관리비 (BigDecimal → number)
//   rentType      — 임대 유형 (enum: RentType)
//   roomSt        — 객실 상태 (enum: RoomStatus)
//   roomOptions   — 옵션 (문자열, 예: "에어컨,냉장고,세탁기")
//   roomCapacity  — 수용 인원
//   rentMin       — 최소 임대 기간 (개월)
//   sunDirection  — 채광 방향 (enum: SunDirection)
//   roomDesc      — 객실 설명
//   files         — 이미지 파일 목록 [{ fileId, fileUrl, ... }]

import { useCallback, useEffect, useState } from 'react';
import { propertyApi } from '../api/propertyApi';

/**
 * @param {number | null | undefined} roomId - 조회할 객실 ID
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRoom = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      // ApiResponse<RoomDetailResponse> → data 자동 unwrap
      const data = await propertyApi.getRoomDetail(id);
      setRoom(data ?? null);
    } catch (err) {
      setError(err?.message || '객실 정보를 불러오는 데 실패했습니다.');
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    fetchRoom(roomId);
  }, [roomId, fetchRoom]);

  // 현재 roomId 그대로 재조회 (새로고침용)
  const refetch = useCallback(() => {
    if (!roomId) return;
    fetchRoom(roomId);
  }, [roomId, fetchRoom]);

  return {
    room,     // RoomDetailResponse | null
    loading,  // 로딩 상태
    error,    // 에러 메시지 (없으면 null)
    refetch,  // 재조회
  };
}
