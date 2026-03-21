import { beforeEach, describe, expect, it } from 'vitest';
import { toErrorGuide, toKoreanMessage } from './errorMapper';

describe('errorMapper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps auth expired error to session-expired message and login action', () => {
    localStorage.setItem('access_token', 'token');
    const err = {
      status: 401,
      response: { status: 401, data: { errorCode: 'AUTH_411' } },
    };

    const message = toKoreanMessage(err);
    const guide = toErrorGuide(err);

    expect(message).toContain('세션이 만료');
    expect(guide.kind).toBe('auth_expired');
    expect(guide.actions.map((v) => v.id)).toContain('login');
  });

  it('maps forbidden error to permission message and home/support actions', () => {
    const err = { status: 403, response: { status: 403, data: {} } };
    const guide = toErrorGuide(err);

    expect(toKoreanMessage(err)).toBe('현재 계정 권한으로 접근할 수 없습니다.');
    expect(guide.kind).toBe('forbidden');
    expect(guide.actions.map((v) => v.id)).toEqual(['home', 'support']);
  });

  it('maps network error to retry actions', () => {
    const err = new TypeError('Failed to fetch');
    const guide = toErrorGuide(err);

    expect(toKoreanMessage(err)).toContain('네트워크');
    expect(guide.kind).toBe('network');
    expect(guide.actions.map((v) => v.id)).toEqual(['retry', 'reload']);
  });

  it('maps server error to retry/support actions', () => {
    const err = { status: 500, response: { status: 500, data: {} } };
    const guide = toErrorGuide(err);

    expect(guide.kind).toBe('server');
    expect(guide.actions.map((v) => v.id)).toEqual(['retry', 'support']);
  });

  it('returns plain message guide for string errors', () => {
    const guide = toErrorGuide('이미지 업로드에 실패했습니다.');

    expect(guide.message).toBe('이미지 업로드에 실패했습니다.');
    expect(guide.actions).toEqual([]);
  });
});
