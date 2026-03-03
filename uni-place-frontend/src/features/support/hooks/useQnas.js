// features/support/hooks/useQnas.js
import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useQnas(initialParams = {}, options = {}) {
  const enabled = options?.enabled ?? true;
  const [qnas, setQnas] = useState([]);
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
    sort: 'qnaId',
    direct: 'DESC',
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQnas = useCallback(
    async (fetchParams) => {
      if (!enabled) return;
      setLoading(true);
      setError(null);
      try {
        const data = await supportApi.getQnas(fetchParams);
        setQnas(data?.content ?? []);
        setPagination({
          page: data?.page ?? fetchParams.page,
          size: data?.size ?? fetchParams.size,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
          isFirst: (data?.page ?? fetchParams.page) === 1,
          isLast: (data?.page ?? fetchParams.page) >= (data?.totalPages ?? 1),
        });
      } catch (err) {
        setError(err?.message || 'QnA 목록을 불러오지 못했습니다.');
        setQnas([]);
      } finally {
        setLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    fetchQnas(params);
  }, [enabled, fetchQnas, params]);

  useEffect(() => {
    if (enabled) return;
    setQnas([]);
    setError(null);
    setLoading(false);
  }, [enabled]);

  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    if (!enabled) return;
    fetchQnas(params);
  }, [enabled, fetchQnas, params]);

  return {
    qnas,
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
