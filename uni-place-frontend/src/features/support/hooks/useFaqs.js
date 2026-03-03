// features/support/hooks/useFaqs.js
import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useFaqs(initialParams = {}) {
  const [faqs, setFaqs] = useState([]);
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
    sort: 'faqId',
    direct: 'DESC',
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFaqs = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await supportApi.getFaqs(fetchParams);
      setFaqs(data?.content ?? []);
      setPagination({
        page: data?.page ?? fetchParams.page,
        size: data?.size ?? fetchParams.size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        isFirst: (data?.page ?? fetchParams.page) === 1,
        isLast: (data?.page ?? fetchParams.page) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setError(err?.message || 'FAQ를 불러오지 못했습니다.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs(params);
  }, [fetchFaqs, params]);

  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    fetchFaqs(params);
  }, [fetchFaqs, params]);

  return {
    faqs,
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
