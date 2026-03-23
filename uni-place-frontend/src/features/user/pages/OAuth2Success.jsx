import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import { authApi } from '../api/authApi';
import styles from './OAuth2Success.module.css';

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  device: 'device_id',
};
const OAUTH_RETURN_TO_KEY = 'oauth_return_to';

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

function consumeOAuthReturnTo() {
  const target = localStorage.getItem(OAUTH_RETURN_TO_KEY) || '';
  localStorage.removeItem(OAUTH_RETURN_TO_KEY);
  return target.startsWith('/') ? target : '/';
}

function getProviderMeta(provider) {
  const key = String(provider || '').toLowerCase();
  if (key === 'google')
    return { key, label: 'Google', chipClass: 'googleChip' };
  if (key === 'kakao') return { key, label: 'Kakao', chipClass: 'kakaoChip' };
  return { key, label: provider || 'Social', chipClass: 'defaultChip' };
}

export default function OAuth2Success() {
  const navigate = useNavigate();
  const payload = useMemo(() => parseHash(), []);
  const providerMeta = useMemo(
    () => getProviderMeta(payload.provider),
    [payload.provider]
  );

  const [form, setForm] = useState({
    userNm: '',
    userBirth: '',
    userTel: '',
    userPwd: '',
    userPwd2: '',
    userNickname: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const setFieldError = (name, msg) =>
    setFieldErrors((p) => ({ ...p, [name]: msg }));
  const clearFieldError = (name) =>
    setFieldErrors((p) => {
      const n = { ...p };
      delete n[name];
      return n;
    });

  /* ── 오류 리다이렉트 ── */
  if (payload.error) {
    localStorage.removeItem(OAUTH_RETURN_TO_KEY);
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.container}>
          <div className={styles.cardWrap}>
            <section className={styles.card}>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <div className={styles.brandLine} aria-hidden="true" />
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>소셜 로그인 실패</h2>
              </div>
              <p className={styles.desc}>오류 코드: {payload.error}</p>
              <button
                className={styles.submit}
                type="button"
                onClick={() => navigate('/login', { replace: true })}
              >
                로그인으로 돌아가기
              </button>
            </section>
          </div>
        </main>
      </div>
    );
  }

  /* ── 토큰 있으면 바로 이동 ── */
  if (payload.accessToken && payload.refreshToken) {
    setTokens(payload);
    const nextPath = consumeOAuthReturnTo();
    window.location.hash = '';
    window.location.replace(nextPath);
    return null;
  }

  const needsSignup = Boolean(payload.signupToken && payload.provider);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    clearFieldError(name);
    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    clearFieldError('userNickname');
    if (!nickname) {
      setFieldError('userNickname', '닉네임을 입력해 주세요.');
      return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      setFieldError('userNickname', '닉네임은 2~20자로 입력해 주세요.');
      return;
    }
    setNicknameStatus('checking');
    try {
      const available = await authApi.checkNickname(nickname);
      if (available) {
        setNicknameStatus('ok');
        setNicknameChecked(true);
      } else {
        setNicknameStatus('dup');
        setNicknameChecked(false);
        setFieldError('userNickname', '이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setNicknameStatus('dup');
      setNicknameChecked(false);
      setFieldError('userNickname', '닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  const onCompleteSignup = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!form.userNm.trim()) {
      setFieldError('userNm', '이름을 입력해 주세요.');
      return;
    }
    if (!form.userNickname.trim()) {
      setFieldError('userNickname', '닉네임을 입력해 주세요.');
      return;
    }
    if (!nicknameChecked) {
      setFieldError('userNickname', '닉네임 중복 확인을 해주세요.');
      return;
    }
    if (!form.userBirth) {
      setFieldError('userBirth', '생년월일을 입력해 주세요.');
      return;
    }
    if (!form.userTel.trim()) {
      setFieldError('userTel', '전화번호를 입력해 주세요.');
      return;
    }
    if (!form.userPwd) {
      setFieldError('userPwd', '비밀번호를 입력해 주세요.');
      return;
    }
    if (form.userPwd.length < 8) {
      setFieldError('userPwd', '비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (form.userPwd !== form.userPwd2) {
      setFieldError('userPwd2', '비밀번호 확인 값이 일치하지 않습니다.');
      return;
    }

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
        providerMeta.key === 'google'
          ? await authApi.googleComplete(req)
          : await authApi.kakaoComplete(req);

      setTokens(tokens || {});
      const nextPath = consumeOAuthReturnTo();
      window.location.hash = '';
      window.location.replace(nextPath);
    } catch (err) {
      setFieldError(
        '_global',
        toKoreanMessage(
          err,
          '소셜 회원가입 완료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <div className={styles.cardWrap}>
          <section className={styles.card}>
            {needsSignup ? (
              <>
                <div className={styles.brand}>
                  <p className={styles.welcome}>WELCOME TO</p>
                  <div className={styles.brandLine} aria-hidden="true" />
                  <h1 className={styles.brandName}>UNI-PLACE</h1>
                  <h2 className={styles.title}>소셜 회원가입</h2>
                </div>

                {/* 프로바이더 칩 */}
                <div className={styles.providerRow}>
                  <span
                    className={`${styles.providerChip} ${styles[providerMeta.chipClass]}`}
                  >
                    {providerMeta.label}
                  </span>
                  <span className={styles.providerHint}>
                    {providerMeta.label} 계정으로 가입을 마무리합니다.
                  </span>
                </div>

                <form
                  className={styles.form}
                  onSubmit={onCompleteSignup}
                  noValidate
                >
                  {/* 전역 에러 */}
                  {fieldErrors._global && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors._global}
                    </p>
                  )}

                  {/* 이름 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userNm ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>이름</span>
                    <input
                      className={styles.input}
                      name="userNm"
                      value={form.userNm}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="실명을 입력해주세요"
                    />
                  </div>
                  {fieldErrors.userNm && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userNm}
                    </p>
                  )}

                  {/* 닉네임 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userNickname ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>닉네임</span>
                    <div className={styles.inlineGroup}>
                      <input
                        className={styles.inlineInput}
                        name="userNickname"
                        value={form.userNickname}
                        onChange={onChange}
                        disabled={submitting}
                        placeholder="2~20자"
                        maxLength={20}
                      />
                      <button
                        className={`${styles.inlineBtn} ${nicknameChecked ? styles.inlineBtnSuccess : ''}`}
                        type="button"
                        onClick={checkNickname}
                        disabled={submitting || nicknameStatus === 'checking'}
                      >
                        {nicknameStatus === 'checking'
                          ? '확인 중…'
                          : nicknameChecked
                            ? '사용 가능'
                            : '중복확인'}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.userNickname && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userNickname}
                    </p>
                  )}
                  {nicknameStatus === 'ok' && (
                    <p className={styles.successText}>
                      사용 가능한 닉네임입니다.
                    </p>
                  )}

                  {/* 생년월일 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userBirth ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>생년월일</span>
                    <input
                      className={styles.input}
                      name="userBirth"
                      type="date"
                      value={form.userBirth}
                      onChange={onChange}
                      disabled={submitting}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  {fieldErrors.userBirth && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userBirth}
                    </p>
                  )}

                  {/* 전화번호 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userTel ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>전화번호</span>
                    <input
                      className={styles.input}
                      name="userTel"
                      value={form.userTel}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="010-1234-5678"
                      autoComplete="tel"
                      maxLength={13}
                    />
                  </div>
                  {fieldErrors.userTel && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userTel}
                    </p>
                  )}

                  {/* 비밀번호 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userPwd ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>비밀번호</span>
                    <input
                      className={styles.input}
                      name="userPwd"
                      type="password"
                      value={form.userPwd}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="8자 이상"
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.userPwd && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userPwd}
                    </p>
                  )}

                  {/* 비밀번호 확인 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userPwd2 ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>비밀번호 확인</span>
                    <input
                      className={styles.input}
                      name="userPwd2"
                      type="password"
                      value={form.userPwd2}
                      onChange={onChange}
                      disabled={submitting}
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.userPwd2 && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userPwd2}
                    </p>
                  )}
                  {form.userPwd2 && form.userPwd === form.userPwd2 && (
                    <p className={styles.successText}>비밀번호가 일치합니다.</p>
                  )}

                  <button
                    className={styles.submit}
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? '처리 중…' : '가입 완료'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className={styles.brand}>
                  <p className={styles.welcome}>WELCOME TO</p>
                  <div className={styles.brandLine} aria-hidden="true" />
                  <h1 className={styles.brandName}>UNI-PLACE</h1>
                  <h2 className={styles.title}>소셜 로그인 처리 중</h2>
                </div>
                <p className={styles.desc}>
                  토큰 정보가 없습니다. 다시 로그인해 주세요.
                </p>
                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  로그인으로 이동
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
