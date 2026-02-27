// features/support/hooks/useFaqs.js
// FAQ 목록 조회 + 페이징
//
// [사용 예시]
// const { faqs, pagination, loading, error, goToPage } = useFaqs();
// const { faqs } = useFaqs({ size: 5, code: 'ROOM' }); // 카테고리 필터

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
      // PageResponse<FaqResponse>
      // 필드: faqId, faqTitle, faqCtnt, createdAt, isActive, code
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
      setError(err?.message || 'FAQ를 불러오는 데 실패했습니다.');
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
    faqs,         // FaqResponse[]
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
