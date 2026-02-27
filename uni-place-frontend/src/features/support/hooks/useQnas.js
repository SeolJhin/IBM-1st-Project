// features/support/hooks/useQnas.js
// QnA 목록 조회 + 페이징 (인증 필요)
//
// [사용 예시]
// const { qnas, pagination, loading, error, goToPage } = useQnas();

import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useQnas(initialParams = {}) {
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

  const fetchQnas = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      // PageResponse<QnaResponse>
      // 필드: qnaId, parentId, qnaTitle, userId, qnaSt, readCount,
      //       qnaCtnt, code, fileCk, replyCk, groupId, qnaLev, createdAt, updatedAt
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
      setError(err?.message || 'QnA 목록을 불러오는 데 실패했습니다.');
      setQnas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQnas(params);
  }, [fetchQnas, params]);

  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    fetchQnas(params);
  }, [fetchQnas, params]);

  return {
    qnas, // QnaResponse[]
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
