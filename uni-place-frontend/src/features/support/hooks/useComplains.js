import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useComplains(initialParams = {}, options = {}) {
  const isAdmin = options?.isAdmin === true;
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
    // sort 파라미터 제거 → 백엔드 쿼리의 중요도순 정렬이 적용됨
    ...initialParams,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComplains = useCallback(
    async (fetchParams) => {
      setLoading(true);
      setError(null);
      try {
        const data = isAdmin
          ? await supportApi.getComplains(fetchParams)
          : await supportApi.getMyComplains(fetchParams);

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
        setError(err?.message || '민원 목록을 불러오지 못했습니다.');
        setComplains([]);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

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
    complains,
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
