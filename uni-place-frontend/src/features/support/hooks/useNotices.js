// features/support/hooks/useNotices.js
// 공지사항 목록 조회 + 페이징
//
// [사용 예시]
// const { notices, pagination, loading, error, goToPage } = useNotices();
// const { notices } = useNotices({ size: 5, sort: 'importance' });

import { useCallback, useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export function useNotices(initialParams = {}) {
  const [notices, setNotices] = useState([]);
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
    sort: 'noticeId',
    direct: 'DESC',
    ...initialParams,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotices = useCallback(async (fetchParams) => {
    setLoading(true);
    setError(null);
    try {
      // PageResponse<NoticeResponse>
      // 필드: noticeId, noticeTitle, userId, noticeCtnt,
      //       importance, impEndAt, readCount, noticeSt,
      //       fileCk, code, createdAt, updatedAt
      const data = await supportApi.getNotices(fetchParams);
      setNotices(data?.content ?? []);
      setPagination({
        page: data?.page ?? fetchParams.page,
        size: data?.size ?? fetchParams.size,
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        isFirst: (data?.page ?? fetchParams.page) === 1,
        isLast: (data?.page ?? fetchParams.page) >= (data?.totalPages ?? 1),
      });
    } catch (err) {
      setError(err?.message || '공지사항을 불러오는 데 실패했습니다.');
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices(params);
  }, [fetchNotices, params]);

  const goToPage = useCallback((nextPage) => {
    setParams((prev) => ({ ...prev, page: nextPage }));
  }, []);

  const updateParams = useCallback((patch) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  }, []);

  const refetch = useCallback(() => {
    fetchNotices(params);
  }, [fetchNotices, params]);

  return {
    notices, // NoticeResponse[]
    pagination,
    loading,
    error,
    goToPage,
    updateParams,
    refetch,
  };
}
