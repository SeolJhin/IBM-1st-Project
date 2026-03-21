import { fetchWithAuthRetry, withApiPrefix } from './apiBase';
import {
  __resetAuthResumeForTest,
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthResumeSnapshot,
  peekAuthResumeSnapshot,
} from '../auth/authResume';

function jsonResponse(status, payload) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name) =>
        name && name.toLowerCase() === 'content-type'
          ? 'application/json'
          : '',
    },
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

describe('fetchWithAuthRetry', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthResumeSnapshot();
    __resetAuthResumeForTest();
    jest.clearAllMocks();
  });

  test('retries once after 401 when refresh succeeds', async () => {
    localStorage.setItem('access_token', 'old-access');
    localStorage.setItem('refresh_token', 'refresh-1');
    localStorage.setItem('device_id', 'device-1');

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          success: true,
          data: {
            accessToken: 'new-access',
            refreshToken: 'refresh-2',
            deviceId: 'device-1',
          },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { ok: true } }));

    global.fetch = fetchMock;

    const res = await fetchWithAuthRetry(
      '/support/qna',
      { method: 'GET' },
      { auth: true }
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/refresh');
    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-2');
  });

  test('does not retry when auth is false', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false }));
    global.fetch = fetchMock;

    const res = await fetchWithAuthRetry(
      '/boards',
      { method: 'GET' },
      { auth: false }
    );

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('clears tokens when refresh fails', async () => {
    localStorage.setItem('access_token', 'old-access');
    localStorage.setItem('refresh_token', 'refresh-1');
    localStorage.setItem('device_id', 'device-1');

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false }));
    global.fetch = fetchMock;

    const res = await fetchWithAuthRetry(
      '/support/qna',
      { method: 'GET' },
      { auth: true }
    );

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  test('dispatches auth-expired event and stores resume snapshot when refresh fails', async () => {
    localStorage.setItem('access_token', 'old-access');
    localStorage.setItem('refresh_token', 'refresh-1');
    localStorage.setItem('device_id', 'device-1');
    document.body.innerHTML =
      '<input id="subject" value="draft-title" /><textarea id="memo">draft-body</textarea>';

    const eventHandler = jest.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, eventHandler);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false }));
    global.fetch = fetchMock;

    await fetchWithAuthRetry('/support/qna', { method: 'GET' }, { auth: true });

    const snapshot = peekAuthResumeSnapshot();
    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(snapshot?.from).toBe('/');
    expect(Array.isArray(snapshot?.draft)).toBe(true);
    expect(snapshot?.draft?.length ?? 0).toBeGreaterThan(0);

    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, eventHandler);
  });
});

describe('withApiPrefix', () => {
  test('does not duplicate /api prefix', () => {
    expect(withApiPrefix('/api/auth/login')).toBe('/api/auth/login');
    expect(withApiPrefix('/auth/login')).toBe('/api/auth/login');
  });
});
