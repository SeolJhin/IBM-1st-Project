import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationApi } from '../api/notificationApi';

/**
 * 알림 훅
 *
 * 사용처
 *  1. Header - 읽지 않은 건수 배지 + 드롭다운 미리보기
 *  2. NotificationList 페이지 - 전체 목록 + 무한 스크롤
 */
export function useNotifications({ autoFetch = true } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 페이징
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const SIZE = 20;

  const isFetching = useRef(false);

  const fetchPage = useCallback(
    async (pageNum = 0, replace = false) => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoading(true);
      setError(null);
      try {
        const res = await notificationApi.getUnread({
          page: pageNum,
          size: SIZE,
        });
        const list = res?.notifications?.content ?? [];
        const total = res?.notifications?.totalElements ?? 0;
        const unread = res?.unreadCount ?? 0;

        setUnreadCount(unread);
        setItems((prev) => (replace ? list : [...prev, ...list]));
        setHasMore(
          (replace ? list.length : items.length + list.length) < total
        );
        setPage(pageNum);
      } catch (e) {
        setError(e.message || '알림을 불러오지 못했어요.');
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [items.length]
  );

  // 초기 로드
  useEffect(() => {
    if (autoFetch) fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  /** 다음 페이지 로드 */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1, false);
  }, [loading, hasMore, page, fetchPage]);

  /** 새로 고침 */
  const refresh = useCallback(() => fetchPage(0, true), [fetchPage]);

  /** 단건 읽음 */
  const markRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markRead(notificationId);
      setItems((prev) => prev.filter((n) => n.notificationId !== notificationId));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('markRead 실패', e);
    }
  }, []);

  /** 전체 읽음 */
  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setItems([]);
      setUnreadCount(0);
    } catch (e) {
      console.error('markAllRead 실패', e);
    }
  }, []);

  /** 읽은 알림 전체 삭제 */
  const deleteRead = useCallback(async () => {
    try {
      await notificationApi.deleteRead();
      await fetchPage(0, true); // 삭제 후 목록 새로고침
    } catch (e) {
      console.error('deleteRead 실패', e);
      throw e;
    }
  }, [fetchPage]);

  return {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    markRead,
    markAllRead,
    deleteRead,
  };
}
