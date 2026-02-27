// features/property/hooks/useBuildings.js
// 빌딩 목록 조회 + 페이징 관리
//
// [사용 예시]
// const { buildings, pagination, loading, error, goToPage, refetch } = useBuildings();
// const { buildings } = useBuildings({ size: 6, sort: 'buildingNm', direct: 'ASC' });

import { useCallback, useEffect, useState } from 'react';
import { propertyApi } from '../api/propertyApi';

/**
 * @typedef {Object} PaginationState
 * @property {number} page         - 현재 페이지 (1부터 시작)
 * @property {number} size         - 페이지당 항목 수
 * @property {number} totalElements - 전체 항목 수
 * @property {number} totalPages   - 전체 페이지 수
 * @property {boolean} isFirst      - 첫 번째 페이지 여부 (page === 1 으로 계산)
 * @property {boolean} isLast       - 마지막 페이지 여부 (page === totalPages 로 계산)
 */

/**
 * @param {{ page?: number, size?: number, sort?: string, direct?: 'ASC'|'DESC' }} initialParams
 */
export function useBuildings(initialParams = {}) {
  const [buildings, setBuildings] = useState([]);
  const [pagination, setPagination] = useState({
    page: initialParams.page ?? 1,
    size: initialParams.size ?? 10,
    totalElements: 0,
    totalPages: 0,
    isFirst: true,
    isLast: true,
  });
  const [params, setParams] = useState({
    page: 1,
    size: 10,
    sort: 'buildingId',
    direct: 'DESC',
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      // PageResponse<BuildingSummaryResponse> 형태로 반환됨
      // 예상 구조: { content: [], page, size, totalElements, totalPages }
      const data = await propertyApi.getBuildings(fetchParams);
      setBuildings(data?.content ?? []);
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
      setError(err?.message || '빌딩 목록을 불러오는 데 실패했습니다.');
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // params가 바뀔 때마다 자동으로 API 호출
  useEffect(() => {
    fetch(params);
  }, [fetch, params]);

  // ─── 페이지 이동 함수 ──────────────────────────────────────────────────────
  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  // 외부에서 필터/정렬 변경 시 (페이지를 1로 리셋)
  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  // 현재 파라미터 그대로 재조회 (새로고침용)
  const refetch = useCallback(() => {
    fetch(params);
  }, [fetch, params]);

  return {
    buildings, // BuildingSummaryResponse[] — 각 항목: { buildingId, buildingNm, buildingAddr, buildingDesc, landCategory, buildSize, buildingUsage, existElv, parkingCapacity, thumbFileId, thumbUrl }
    pagination, // 페이징 정보
    loading, // 로딩 상태
    error, // 에러 메시지 (없으면 null)
    goToPage, // 페이지 이동: goToPage(2)
    updateParams, // 정렬/사이즈 변경: updateParams({ sort: 'buildingNm' })
    refetch, // 재조회
  };
}
