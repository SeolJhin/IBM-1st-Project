import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { authApi } from '../api/authApi';
import styles from './OAuth2Success.module.css';

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  device: 'device_id',
};

function parseHash() {
  const hash = window.location.hash?.startsWith('#')
    ? window.location.hash.slice(1)
    : '';
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('accessToken') || '',
    refreshToken: params.get('refreshToken') || '',
    deviceId: params.get('deviceId') || '',
    signupToken: params.get('signupToken') || '',
    provider: params.get('provider') || '',
    error: params.get('error') || '',
  };
}

function setTokens({ accessToken, refreshToken, deviceId }) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  if (deviceId) localStorage.setItem(STORAGE_KEYS.device, deviceId);
}

export default function OAuth2Success() {
  const navigate = useNavigate();
  const payload = useMemo(() => parseHash(), []);

  const [form, setForm] = useState({
    userNm: '',
    userBirth: '',
    userTel: '',
    userPwd: '',
    userPwd2: '',
    userNickname: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);

  if (payload.error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.wrap}>
          <section className={styles.card}>
            <h2>소셜 로그인 실패</h2>
            <p>오류 코드: {payload.error}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              로그인으로 돌아가기
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (payload.accessToken && payload.refreshToken) {
    setTokens(payload);
    window.location.hash = '';
    window.location.replace('/');
    return null;
  }

  const needsSignup = Boolean(payload.signupToken && payload.provider);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    if (!nickname) return setError('닉네임을 입력해 주세요.');
    if (nickname.length < 2 || nickname.length > 20)
      return setError('닉네임은 2~20자로 입력해주세요.');
    setNicknameStatus('checking');
    setError('');
    try {
      const available = await authApi.checkNickname(nickname);
      if (available) {
        setNicknameStatus('ok');
        setNicknameChecked(true);
      } else {
        setNicknameStatus('dup');
        setNicknameChecked(false);
      }
    } catch {
      setNicknameStatus('dup');
      setNicknameChecked(false);
    }
  };

  const onCompleteSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.userNm.trim()) return setError('이름을 입력해 주세요.');
    if (!form.userNickname.trim()) return setError('닉네임을 입력해 주세요.');
    if (!nicknameChecked) return setError('닉네임 중복 확인을 해주세요.');
    if (!form.userBirth) return setError('생년월일을 입력해 주세요.');
    if (!form.userTel.trim()) return setError('전화번호를 입력해 주세요.');
    if (!form.userPwd) return setError('비밀번호를 입력해 주세요.');
    if (form.userPwd.length < 8)
      return setError('비밀번호는 8자 이상이어야 합니다.');
    if (form.userPwd !== form.userPwd2)
      return setError('비밀번호 확인 값이 일치하지 않습니다.');

    try {
      setSubmitting(true);
      const req = {
        signupToken: payload.signupToken,
        userNm: form.userNm.trim(),
        userNickname: form.userNickname.trim(),
        userBirth: form.userBirth,
        userTel: form.userTel.trim(),
        userPwd: form.userPwd,
      };

      const tokens =
        payload.provider.toLowerCase() === 'google'
          ? await authApi.googleComplete(req)
          : await authApi.kakaoComplete(req);

      setTokens(tokens || {});
      window.location.hash = '';
      window.location.replace('/');
    } catch (err) {
      setError(err?.message || '소셜 가입 완료 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.wrap}>
        <section className={styles.card}>
          {needsSignup ? (
            <>
              <h2>소셜 회원가입 추가 정보</h2>
              <p>
                {payload.provider.toUpperCase()} 계정 연동을 마무리해 주세요.
              </p>

              <form onSubmit={onCompleteSignup} className={styles.form}>
                <input
                  name="userNm"
                  value={form.userNm}
                  onChange={onChange}
                  placeholder="이름"
                  disabled={submitting}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ flex: 1 }}
                    name="userNickname"
                    value={form.userNickname}
                    onChange={onChange}
                    placeholder="닉네임 (2~20자)"
                    maxLength={20}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={checkNickname}
                    disabled={submitting || nicknameStatus === 'checking'}
                    style={{
                      padding: '0 14px',
                      borderRadius: 8,
                      background: nicknameChecked ? '#22c55e' : '#111',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {nicknameStatus === 'checking'
                      ? '확인 중…'
                      : nicknameChecked
                        ? '✓ 사용가능'
                        : '중복확인'}
                  </button>
                </div>
                {nicknameStatus === 'dup' && (
                  <div className={styles.error}>
                    이미 사용 중인 닉네임입니다.
                  </div>
                )}
                {nicknameStatus === 'ok' && (
                  <div style={{ color: '#22c55e', fontSize: 13 }}>
                    사용 가능한 닉네임입니다.
                  </div>
                )}
                <input
                  name="userBirth"
                  type="date"
                  value={form.userBirth}
                  onChange={onChange}
                  disabled={submitting}
                />
                <input
                  name="userTel"
                  value={form.userTel}
                  onChange={onChange}
                  placeholder="010-1234-5678"
                  disabled={submitting}
                />
                <input
                  name="userPwd"
                  type="password"
                  value={form.userPwd}
                  onChange={onChange}
                  placeholder="비밀번호 (8자 이상)"
                  disabled={submitting}
                />
                <input
                  name="userPwd2"
                  type="password"
                  value={form.userPwd2}
                  onChange={onChange}
                  placeholder="비밀번호 확인"
                  disabled={submitting}
                />
                {error ? <div className={styles.error}>{error}</div> : null}
                <button type="submit" disabled={submitting}>
                  {submitting ? '처리 중...' : '가입 완료'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>소셜 로그인 처리 중</h2>
              <p>토큰 정보가 없습니다. 다시 로그인해 주세요.</p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
              >
                로그인으로 이동
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
