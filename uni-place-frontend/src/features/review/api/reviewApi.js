// features/review/api/reviewApi.js
//
// [엔드포인트]
//   GET    /reviews?roomId=&page=0&size=10   → 방별 리뷰 목록 (public)
//   GET    /reviews/my?page=0&size=10         → 내 리뷰 목록 (auth)
//   GET    /reviews/{reviewId}               → 리뷰 상세 (public)
//   GET    /reviews/rooms/{roomId}/summary   → 방 리뷰 요약 (public)
//   POST   /reviews                          → 리뷰 작성 (auth, multipart)
//   PUT    /reviews/{reviewId}               → 리뷰 수정 (auth, multipart)
//   DELETE /reviews/{reviewId}              → 리뷰 삭제 (auth)
//
// [ReviewResponse 필드]
//   reviewId, userId, roomId, rating(1~5),
//   reviewTitle, reviewCtnt, code, fileCk, replyCk,
//   createdAt, updatedAt, files[], thumbnailUrl,
//   buildingId, buildingNm, roomNo

import { api } from '../../../app/http/axiosInstance';
import { tokenStore } from '../../../app/http/tokenStore';

// FormData 전송용 fetch 헬퍼 (axios 기본 Content-Type 우회)
function fetchMultipart(method, path, form, params) {
  const token = tokenStore.getAccess();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = params
    ? `/api${path}?${new URLSearchParams(params).toString()}`
    : `/api${path}`;
  return fetch(url, { method, headers, body: form })
    .then((res) => res.json())
    .then((d) => {
      if (d && typeof d === 'object' && 'success' in d) {
        if (d.success) return d.data;
        throw new Error(d.message || 'API 오류');
      }
      return d;
    });
}

const unwrap = (res) => {
  const d = res.data;
  if (d && typeof d === 'object' && 'success' in d) {
    if (d.success) return d.data;
    throw new Error(d.message || 'API 오류');
  }
  return d;
};

export const reviewApi = {
  /**
   * GET /reviews?roomId={roomId}&page=0&size=10
   * → PageResponse<ReviewResponse>  (public)
   */
  getListByRoom: (roomId, params = {}) =>
    api
      .get('/reviews', {
        params: {
          roomId,
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort ?? 'reviewId,desc',
        },
      })
      .then(unwrap),

  /**
   * GET /reviews/my?page=0&size=10
   * → PageResponse<ReviewResponse>  (auth)
   */
  getMyList: (params = {}) =>
    api
      .get('/reviews/my', {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
          sort: params.sort ?? 'reviewId,desc',
        },
      })
      .then(unwrap),

  /**
   * GET /reviews/{reviewId}
   * → ReviewResponse  (public)
   */
  getDetail: (reviewId) => api.get(`/reviews/${reviewId}`).then(unwrap),

  /**
   * GET /reviews/rooms/{roomId}/summary
   * → { roomId, avgRating, reviewCount }  (public)
   */
  getRoomSummary: (roomId) =>
    api.get(`/reviews/rooms/${roomId}/summary`).then(unwrap),

  /**
   * POST /reviews  multipart/form-data
   * body: { roomId, rating, reviewTitle?, reviewCtnt?, code? }
   * files: ofiles[]  (optional, max 5)
   * → void  (auth)
   */
  create: (body, files = []) => {
    const form = new FormData();
    form.append('roomId', body.roomId);
    form.append('rating', body.rating);
    if (body.reviewTitle) form.append('reviewTitle', body.reviewTitle);
    if (body.reviewCtnt) form.append('reviewCtnt', body.reviewCtnt);
    if (body.code) form.append('code', body.code);
    files.forEach((f) => form.append('ofiles', f));
    return fetchMultipart('POST', '/reviews', form);
  },

  /**
   * PUT /reviews/{reviewId}  multipart/form-data
   * body: { rating?, reviewTitle?, reviewCtnt?, code? }
   * deleteFiles: boolean (기존 파일 전체 삭제 여부)
   * files: 새로 추가할 ofiles[]
   * → void  (auth)
   */
  update: (reviewId, body, deleteFiles = false, files = []) => {
    const form = new FormData();
    if (body.rating != null) form.append('rating', body.rating);
    if (body.reviewTitle != null) form.append('reviewTitle', body.reviewTitle);
    if (body.reviewCtnt != null) form.append('reviewCtnt', body.reviewCtnt);
    if (body.code != null) form.append('code', body.code);
    files.forEach((f) => form.append('ofiles', f));
    return fetchMultipart('PUT', `/reviews/${reviewId}`, form, { deleteFiles });
  },

  /**
   * DELETE /reviews/{reviewId}
   * → void  (auth)
   */
  remove: (reviewId) => api.delete(`/reviews/${reviewId}`).then(unwrap),
};
