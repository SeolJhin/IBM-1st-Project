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
//   POST   /reviews/{reviewId}/likes         → 좋아요 (auth)
//   DELETE /reviews/{reviewId}/likes         → 좋아요 취소 (auth)
//
// [ReviewResponse 필드]
//   reviewId, userId, roomId, rating(1~5),
//   reviewTitle, reviewCtnt, code, fileCk, replyCk,
//   readCount, likeCount, likedByMe, createdAt, updatedAt, files[], thumbnailUrl,
//   buildingId, buildingNm, roomNo

import { api } from '../../../app/http/axiosInstance';

const unwrap = (res) => {
  const d = res.data;
  if (d && typeof d === 'object' && 'success' in d) {
    if (d.success) return d.data;
    // 백엔드가 success:false 로 응답한 경우 (2xx인데 실패 — 드문 케이스)
    const err = new Error(d.message || 'API 오류');
    err.errorCode = d.errorCode;
    throw err;
  }
  return d;
};

// axios 4xx/5xx 에러에서 백엔드 ApiResponse { errorCode, message } 추출
const extractApiError = (axiosError) => {
  const data = axiosError?.response?.data;
  if (data && typeof data === 'object' && 'errorCode' in data) {
    const err = new Error(data.message || 'API 오류');
    err.errorCode = data.errorCode;
    return err;
  }
  return axiosError;
};

const call = (promise) =>
  promise.then(unwrap).catch((e) => {
    throw extractApiError(e);
  });

export const reviewApi = {
  getAll: (params = {}) =>
    call(
      api.get('/reviews', {
        params: { page: params.page ?? 0, size: params.size ?? 10 },
      })
    ),

  getListByRoom: (roomId, params = {}) =>
    call(
      api.get('/reviews', {
        params: { roomId, page: params.page ?? 0, size: params.size ?? 10 },
      })
    ),

  getMyList: (params = {}) =>
    call(
      api.get('/reviews/my', {
        params: { page: params.page ?? 0, size: params.size ?? 10 },
      })
    ),

  getDetail: (reviewId, { increaseReadCount = true } = {}) => {
    const qs = new URLSearchParams();
    if (!increaseReadCount) qs.set('increaseReadCount', 'false');
    const query = qs.toString();
    return call(api.get(`/reviews/${reviewId}${query ? `?${query}` : ''}`));
  },

  getRoomSummary: (roomId) => call(api.get(`/reviews/rooms/${roomId}/summary`)),

  create: (body, files = []) => {
    const form = new FormData();
    form.append('roomId', body.roomId);
    form.append('rating', body.rating);
    if (body.reviewTitle) form.append('reviewTitle', body.reviewTitle);
    if (body.reviewCtnt) form.append('reviewCtnt', body.reviewCtnt);
    if (body.code) form.append('code', body.code);
    files.forEach((f) => form.append('ofiles', f));
    return call(
      api.post('/reviews', form, { headers: { 'Content-Type': undefined } })
    );
  },

  update: (reviewId, body, deleteFiles = false, files = []) => {
    const form = new FormData();
    if (body.rating != null) form.append('rating', body.rating);
    if (body.reviewTitle != null) form.append('reviewTitle', body.reviewTitle);
    if (body.reviewCtnt != null) form.append('reviewCtnt', body.reviewCtnt);
    if (body.code != null) form.append('code', body.code);
    files.forEach((f) => form.append('ofiles', f));
    return call(
      api.put(`/reviews/${reviewId}`, form, {
        params: { deleteFiles },
        headers: { 'Content-Type': undefined },
      })
    );
  },

  remove: (reviewId) => call(api.delete(`/reviews/${reviewId}`)),

  likeReview: (reviewId) => call(api.post(`/reviews/${reviewId}/likes`)),

  unlikeReview: (reviewId) => call(api.delete(`/reviews/${reviewId}/likes`)),

  // 조회수 증가는 실패해도 무시
  incrementReadCount: (reviewId) =>
    call(api.post(`/reviews/${reviewId}/read-count`)).catch(() => {}),
};
