// features/property/hooks/useRooms.js
// 객실 목록 조회 + 페이징 + 필터링 관리
// 백엔드 RoomSearchRequest.java 필드 전체 대응
//
// [사용 예시]
// const { rooms, pagination, loading, error, goToPage, updateParams, refetch } = useRooms();
//
// [필터 적용 예시]
// const { rooms } = useRooms({ buildingId: 1, roomSt: 'AVAILABLE', minRentPrice: 500000 });
//
// [필터 동적 변경]
// updateParams({ rentType: 'MONTHLY', maxRentPrice: 1000000 }); // 페이지 1로 자동 리셋

import { useCallback, useEffect, useState } from 'react';
import { propertyApi } from '../api/propertyApi';

/**
 * @param {{
 *   // ── 빌딩 조건 (RoomSearchRequest - building 필드) ──
 *   buildingId?: number,          — 빌딩 ID (정확히)
 *   buildingNm?: string,          — 빌딩명 (부분검색)
 *   buildingAddr?: string,        — 빌딩 주소 (부분검색)
 *   minParkingCapacity?: number,  — 주차 가능 대수 이상
 *
 *   // ── 객실 조건 (RoomSearchRequest - rooms 필드) ──
 *   roomNo?: number,              — 호실 번호 (정확히)
 *   floor?: number,               — 층수 (정확히)
 *
 *   minRoomSize?: number,         — 면적 이상 (㎡)
 *   maxRoomSize?: number,         — 면적 이하 (㎡)
 *
 *   minDeposit?: number,          — 보증금 이상 (원)
 *   maxDeposit?: number,          — 보증금 이하 (원)
 *
 *   minRentPrice?: number,        — 월세 이상 (원)
 *   maxRentPrice?: number,        — 월세 이하 (원)
 *
 *   minManageFee?: number,        — 관리비 이상 (원)
 *   maxManageFee?: number,        — 관리비 이하 (원)
 *
 *   rentType?: 'MONTHLY'|'JEONSE'|'SHORT_TERM',   — 임대 유형 (RentType enum)
 *   roomSt?: 'AVAILABLE'|'OCCUPIED'|'MAINTENANCE', — 객실 상태 (RoomStatus enum)
 *   sunDirection?: 'EAST'|'WEST'|'SOUTH'|'NORTH',  — 채광 방향 (SunDirection enum)
 *
 *   minRoomCapacity?: number,     — 수용인원 이상
 *   maxRoomCapacity?: number,     — 수용인원 이하
 *
 *   minRentMin?: number,          — 최소 임대기간 이상 (개월)
 *   maxRentMin?: number,          — 최소 임대기간 이하 (개월)
 *
 *   roomOptions?: string,         — 옵션 (부분검색, 예: "에어컨")
 *
 *   // ── 페이징/정렬 ──
 *   page?: number,
 *   size?: number,
 *   sort?: string,
 *   direct?: 'ASC'|'DESC'
 * }} initialParams
 */
export function useRooms(initialParams = {}) {
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState({
    page: initialParams.page ?? 1,
    size: initialParams.size ?? 10,
    totalElements: 0,
    totalPages: 0,
    isFirst: true,
    isLast: true,
  });
  const [params, setParams] = useState({
    // 기본 페이징
    page: 1,
    size: 10,
    sort: 'roomId',
    direct: 'DESC',
    // 초기 필터 (없으면 전체 조회)
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      // PageResponse<RoomSummaryResponse> 형태로 반환
      // 구조: { content: [], page, size, totalElements, totalPages }
      const data = await propertyApi.getRoomsAll(fetchParams);
      setRooms(data?.content ?? []);
      setPagination({
        page: data?.page ?? fetchParams.page,
        size: data?.size ?? fetchParams.size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        // PageResponse에 first/last 없음 → 직접 계산
        isFirst: (data?.page ?? fetchParams.page) === 1,
        isLast: (data?.page ?? fetchParams.page) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setError(err?.message || '객실 목록을 불러오는 데 실패했습니다.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // params가 바뀔 때마다 자동으로 API 호출
  useEffect(() => {
    fetch(params);
  }, [fetch, params]);

  // ─── 페이지 이동 ───────────────────────────────────────────────────────────
  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  // ─── 필터/정렬 변경 (페이지 1로 자동 리셋) ────────────────────────────────
  // 예: updateParams({ roomSt: 'AVAILABLE', minRentPrice: 500000 })
  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  // ─── 필터 전체 초기화 ──────────────────────────────────────────────────────
  const resetParams = useCallback(() => {
    setParams({ page: 1, size: 10, sort: 'roomId', direct: 'DESC' });
  }, []);

  // ─── 현재 파라미터 그대로 재조회 ──────────────────────────────────────────
  const refetch = useCallback(() => {
    fetch(params);
  }, [fetch, params]);

  return {
    rooms,      // RoomSummaryResponse[] — 각 항목:
                // { roomId, buildingId, buildingNm, buildingAddr, buildingDesc, parkingCapacity,
                //   roomNo, floor, roomSize, deposit, rentPrice, manageFee,
                //   rentType, roomSt, roomCapacity, rentMin, sunDirection,
                //   thumbnailFileId, thumbnailUrl }
    pagination, // { page, size, totalElements, totalPages, isFirst, isLast }
    params,     // 현재 적용된 필터 파라미터 (디버깅/UI 표시용)
    loading,
    error,
    goToPage,     // 페이지 이동:          goToPage(2)
    updateParams, // 필터/정렬 변경:       updateParams({ roomSt: 'AVAILABLE' })
    resetParams,  // 필터 전체 초기화:     resetParams()
    refetch,      // 현재 조건 재조회:     refetch()
  };
}
