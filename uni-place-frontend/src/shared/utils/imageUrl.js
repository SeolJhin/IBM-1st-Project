export function toApiImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return url;
  return `/api${url.startsWith('/') ? url : `/${url}`}`;
}

export function getFirstImageUrl(files) {
  if (!Array.isArray(files) || files.length === 0) return null;
  const first = files[0];
  return toApiImageUrl(first?.viewUrl || first?.adminViewUrl);
}
