// features/property/hooks/useBuilding.js
// 빌딩 상세 정보 + 객실 목록 + 공용공간 목록을 한 번에 관리
//
// [사용 예시]
// const { building, rooms, spaces, loading, error, refetch } = useBuilding(buildingId);
//
// [분리 사용 예시] - 객실만 필요할 때
// const { building, loading } = useBuilding(buildingId, { fetchRooms: false, fetchSpaces: false });

import { useCallback, useEffect, useState } from 'react';
import { propertyApi } from '../api/propertyApi';

const INITIAL_PAGE = {
  content: [],
  page: 1,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  isFirst: true,
  isLast: true,
};

/**
 * @param {number | null} buildingId  - 조회할 빌딩 ID (null이면 호출 안 함)
 * @param {{
 *   fetchRooms?: boolean,
 *   fetchSpaces?: boolean,
 *   roomParams?: { page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' },
 *   spaceParams?: { page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' },
 * }} options
 */
export function useBuilding(buildingId, options = {}) {
  const {
    fetchRooms = true,
    fetchSpaces = true,
    roomParams = {},
    spaceParams = {},
  } = options;

  // ─── 빌딩 상세 ─────────────────────────────────────────────────────────────
  const [building, setBuilding] = useState(null);
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [buildingError, setBuildingError] = useState(null);

  // ─── 객실 목록 ─────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState(INITIAL_PAGE);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

  // ─── 공용공간 목록 ─────────────────────────────────────────────────────────
  const [spaces, setSpaces] = useState(INITIAL_PAGE);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState(null);

  // ─── 빌딩 상세 조회 ────────────────────────────────────────────────────────
  const fetchBuilding = useCallback(async (id) => {
    setBuildingLoading(true);
    setBuildingError(null);
    try {
      // BuildingDetailResponse: buildingId, buildingNm, buildingAddr, buildingDesc, landCategory, buildSize, buildingUsage, existElv, parkingCapacity, files[]
      const data = await propertyApi.getBuildingDetail(id);
      setBuilding(data ?? null);
    } catch (err) {
      setBuildingError(err?.message || '빌딩 정보를 불러오는 데 실패했습니다.');
      setBuilding(null);
    } finally {
      setBuildingLoading(false);
    }
  }, []);

  // ─── 객실 목록 조회 ────────────────────────────────────────────────────────
  const fetchRoomList = useCallback(async (id, params) => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      // PageResponse<RoomSummaryResponse>
      const data = await propertyApi.getRooms(id, params);
      setRooms({
        content: data?.content ?? [],
        page: data?.page ?? 1,
        size: data?.size ?? 10,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        // PageResponse에 first/last 없음 → 직접 계산
        isFirst: (data?.page ?? 1) === 1,
        isLast: (data?.page ?? 1) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setRoomsError(err?.message || '객실 목록을 불러오는 데 실패했습니다.');
      setRooms(INITIAL_PAGE);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // ─── 공용공간 목록 조회 ────────────────────────────────────────────────────
  const fetchSpaceList = useCallback(async (id, params) => {
    setSpacesLoading(true);
    setSpacesError(null);
    try {
      // PageResponse<SpaceResponse>
      const data = await propertyApi.getSpaces(id, params);
      setSpaces({
        content: data?.content ?? [],
        page: data?.page ?? 1,
        size: data?.size ?? 10,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        // PageResponse에 first/last 없음 → 직접 계산
        isFirst: (data?.page ?? 1) === 1,
        isLast: (data?.page ?? 1) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setSpacesError(err?.message || '공용공간 목록을 불러오는 데 실패했습니다.');
      setSpaces(INITIAL_PAGE);
    } finally {
      setSpacesLoading(false);
    }
  }, []);

  // ─── buildingId 바뀔 때 전체 재조회 ───────────────────────────────────────
  useEffect(() => {
    if (!buildingId) return;

    fetchBuilding(buildingId);
    if (fetchRooms) fetchRoomList(buildingId, roomParams);
    if (fetchSpaces) fetchSpaceList(buildingId, spaceParams);
    // roomParams, spaceParams는 초기값만 사용 (의존성 배열에서 제외)
    // 페이지 이동이 필요하면 goToRoomPage / goToSpacePage 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, fetchBuilding, fetchRoomList, fetchSpaceList, fetchRooms, fetchSpaces]);

  // ─── 객실 페이지 이동 ──────────────────────────────────────────────────────
  const goToRoomPage = useCallback((nextPage) => {
    if (!buildingId) return;
    fetchRoomList(buildingId, { ...roomParams, page: nextPage });
  }, [buildingId, fetchRoomList, roomParams]);

  // ─── 공용공간 페이지 이동 ──────────────────────────────────────────────────
  const goToSpacePage = useCallback((nextPage) => {
    if (!buildingId) return;
    fetchSpaceList(buildingId, { ...spaceParams, page: nextPage });
  }, [buildingId, fetchSpaceList, spaceParams]);

  // ─── 전체 재조회 ───────────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    if (!buildingId) return;
    fetchBuilding(buildingId);
    if (fetchRooms) fetchRoomList(buildingId, roomParams);
    if (fetchSpaces) fetchSpaceList(buildingId, spaceParams);
  }, [buildingId, fetchBuilding, fetchRoomList, fetchSpaceList, fetchRooms, fetchSpaces, roomParams, spaceParams]);

  return {
    // 빌딩 상세 — BuildingDetailResponse: { buildingId, buildingNm, buildingAddr, buildingDesc, landCategory, buildSize, buildingUsage, existElv, parkingCapacity, files[] }
    building,        // BuildingDetailResponse | null
    buildingLoading,
    buildingError,

    // 객실 목록
    rooms,           // { content: RoomSummaryResponse[], page, size, totalElements, totalPages, isFirst, isLast }
                     // RoomSummaryResponse 각 항목: { roomId, buildingId, buildingNm, roomNo, floor, roomSize, deposit, rentPrice, manageFee, rentType, roomSt, roomCapacity, rentMin, sunDirection, thumbnailFileId, thumbnailUrl }
    roomsLoading,
    roomsError,
    goToRoomPage,    // 객실 페이지 이동: goToRoomPage(2)

    // 공용공간 목록
    spaces,          // { content: SpaceResponse[], page, size, totalElements, totalPages, isFirst, isLast }
    spacesLoading,
    spacesError,
    goToSpacePage,   // 공용공간 페이지 이동: goToSpacePage(2)

    // 전체 로딩 여부 (하나라도 로딩 중이면 true)
    loading: buildingLoading || roomsLoading || spacesLoading,
    // 전체 에러 (가장 먼저 발생한 에러 반환)
    error: buildingError || roomsError || spacesError,

    refetch,
  };
}
