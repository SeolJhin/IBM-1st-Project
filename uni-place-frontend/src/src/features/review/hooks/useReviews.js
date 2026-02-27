// features/review/hooks/useReviews.js
import { useCallback, useEffect, useState } from 'react';
import { reviewApi } from '../api/reviewApi';

// ── 내부 공통 페이지 훅 ──────────────────────────────────────
function usePaginatedReviews(fetcher, deps = []) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(
    async (page = 0) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetcher(page);
        setItems(data?.content ?? []);
        setPagination({
          page: data?.page ?? page,
          size: data?.size ?? 10,
          totalElements: data?.totalElements ?? 0,
          totalPages: data?.totalPages ?? 0,
        });
      } catch (e) {
        setError(e.message || '불러오지 못했어요.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  const goToPage = useCallback((p) => fetch(p), [fetch]);
  const refetch = useCallback(
    () => fetch(pagination.page),
    [fetch, pagination.page]
  );

  return { items, pagination, loading, error, goToPage, refetch, fetch };
}

/* ──────────────────────────────────────────
 * 1. 방별 리뷰 목록 (public)
 *    roomId 필수 / 자동 최초 조회
 * ────────────────────────────────────────── */
export function useRoomReviews(roomId, size = 10) {
  const { items, pagination, loading, error, goToPage, refetch, fetch } =
    usePaginatedReviews(
      (page) => reviewApi.getListByRoom(roomId, { page, size }),
      [roomId, size]
    );

  useEffect(() => {
    if (roomId) fetch(0);
  }, [roomId, fetch]);

  return { reviews: items, pagination, loading, error, goToPage, refetch };
}

/* ──────────────────────────────────────────
 * 2. 내 리뷰 목록 (auth)
 * ────────────────────────────────────────── */
export function useMyReviews(size = 10) {
  const { items, pagination, loading, error, goToPage, refetch, fetch } =
    usePaginatedReviews((page) => reviewApi.getMyList({ page, size }), [size]);

  useEffect(() => {
    fetch(0);
  }, [fetch]);

  return { reviews: items, pagination, loading, error, goToPage, refetch };
}

/* ──────────────────────────────────────────
 * 3. 리뷰 상세 (public)
 * ────────────────────────────────────────── */
export function useReviewDetail(reviewId) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!reviewId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await reviewApi.getDetail(reviewId);
      setReview(data);
    } catch (e) {
      setError(e.message || '불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { review, loading, error, refetch: fetch };
}

/* ──────────────────────────────────────────
 * 4. 방 리뷰 요약 (public)
 *    → { roomId, avgRating, reviewCount }
 * ────────────────────────────────────────── */
export function useRoomReviewSummary(roomId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    reviewApi
      .getRoomSummary(roomId)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  return { summary, loading };
}

/* ──────────────────────────────────────────
 * 5. 리뷰 CRUD 액션 (auth)
 *    create / update / remove
 * ────────────────────────────────────────── */
export function useReviewActions() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (body, files = []) => {
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.create(body, files);
      return true;
    } catch (e) {
      setError(e.message || '리뷰 등록에 실패했어요.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const update = useCallback(
    async (reviewId, body, deleteFiles, files = []) => {
      setSubmitting(true);
      setError(null);
      try {
        await reviewApi.update(reviewId, body, deleteFiles, files);
        return true;
      } catch (e) {
        setError(e.message || '리뷰 수정에 실패했어요.');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const remove = useCallback(async (reviewId) => {
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.remove(reviewId);
      return true;
    } catch (e) {
      setError(e.message || '리뷰 삭제에 실패했어요.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { create, update, remove, submitting, error };
}
