const API_PREFIX = '/api';
const ABSOLUTE_URL_RE = /^https?:\/\//i;

export function withApiPrefix(path) {
  if (!path) return API_PREFIX;
  if (ABSOLUTE_URL_RE.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_PREFIX}${normalizedPath}`;
}

