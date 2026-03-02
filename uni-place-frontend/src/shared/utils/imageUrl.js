/**
 * 백엔드에서 내려오는 이미지 URL에 /api 프리픽스를 붙여주는 헬퍼
 * 백엔드: /files/{id}/view  →  프론트 필요: /api/files/{id}/view
 */
export function toApiImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;
  return `/api${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * FileResponse 배열에서 첫 번째 이미지의 viewUrl을 /api 포함으로 반환
 */
export function getFirstImageUrl(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const first = files[0];
  return toApiImageUrl(first?.viewUrl || first?.adminViewUrl);
}
