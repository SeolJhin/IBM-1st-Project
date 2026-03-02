// features/support/hooks/useComplains.js
// 내 민원 목록 조회 + 페이징 (인증 필요)
//
// [사용 예시]
// const { complains, pagination, loading, error, goToPage } = useComplains();

import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useComplains(initialParams = {}) {
  const [complains, setComplains] = useState([]);
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
    sort: 'compId',
    direct: 'DESC',
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComplains = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      // PageResponse<ComplainResponse>
      // 필드: compId, compTitle, userId, compCtnt, compSt,
      //       code, fileCk, replyCk, createdAt, updatedAt
      const data = await supportApi.getComplains(fetchParams);
      setComplains(data?.content ?? []);
      setPagination({
        page: data?.page ?? fetchParams.page,
        size: data?.size ?? fetchParams.size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        isFirst: (data?.page ?? fetchParams.page) === 1,
        isLast: (data?.page ?? fetchParams.page) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setError(err?.message || '민원 목록을 불러오는 데 실패했습니다.');
      setComplains([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplains(params);
  }, [fetchComplains, params]);

  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    fetchComplains(params);
  }, [fetchComplains, params]);

  return {
    complains, // ComplainResponse[]
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
