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
<<<<<<< HEAD
      // ✅ 여기만 변경됨
      const data = isAdmin
        ? await supportApi.getComplains(fetchParams)
        : await supportApi.getMyComplains(fetchParams);
=======
      const data = await supportApi.getComplains(fetchParams);
>>>>>>> 67cf15dfe5cf9efd002ce0bc695e6e9cfb7e9914

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
  }, [isAdmin]);

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
