const APP_CONFIG_KEY = '__APP_CONFIG__';

const DEFAULT_APP_CONFIG = Object.freeze({
  BACKEND_BASE_URL: '/api',
  KAKAO_MAP_KEY: '',
  KMA_KEY: '',
  GEMINI_API_KEY: '',
});

function readAppConfig() {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_CONFIG;
  }

  const candidate = window[APP_CONFIG_KEY];
  if (!candidate || typeof candidate !== 'object') {
    return DEFAULT_APP_CONFIG;
  }

  return {
    ...DEFAULT_APP_CONFIG,
    ...candidate,
  };
}

const appConfig = readAppConfig();

export function getAppConfig() {
  return appConfig;
}

export function getAppConfigValue(key, fallback = '') {
  const value = appConfig[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}
