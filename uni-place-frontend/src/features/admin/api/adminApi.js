// src/features/admin/api/adminApi.js
import { apiJson } from '../../../app/http/request';

/**
 * 관리자 대시보드 요약 숫자 조회
 * 서버에서 아직 엔드포인트가 없다면:
 * - 백엔드에 GET /admin/dashboard 만들어서 아래 형태로 내려주면 됨
 *
 * response example:
 * {
 *   residentCount: 73,
 *   facilityCount: 73,
 *   tourCount: 4,
 *   contractCount: 48,
 *   bannerViewCount: 217,
 *   roomServiceOrderCount: 11
 * }
 */
export async function getAdminDashboard() {
  // 권장: 백엔드에 이 엔드포인트 맞춰서 구현
  return apiJson.get('/admin/dashboard');
}
