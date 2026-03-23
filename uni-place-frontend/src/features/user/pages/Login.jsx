import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../hooks/useAuth';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import FaceLoginModal from '../components/FaceLoginModal';
import ErrorActionNotice from '../../../shared/components/ErrorActionNotice/ErrorActionNotice';
import {
  AUTH_EXPIRED_NOTICE,
  getAuthResumePath,
} from '../../../app/auth/authResume';
import { getAppConfigValue } from '../../../app/config/appConfigReader';

export default function Login() {
  const { login, loading, refresh } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [faceModal, setFaceModal] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const errorRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const notice =
    location.state?.message ||
    (location.state?.reason === 'auth_expired' ? AUTH_EXPIRED_NOTICE : '');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const focusField = (name) => {
    if (name === 'email') emailInputRef.current?.focus();
    if (name === 'password') passwordInputRef.current?.focus();
  };

  const setFieldError = (name, message) => {
    // fieldErrors만 설정 — 위에 ErrorActionNotice 뜨지 않도록 setError 호출 안 함
    setFieldErrors({ email: '', password: '', [name]: message });
    requestAnimationFrame(() => focusField(name));
  };

  const runLogin = async ({ validate = true } = {}) => {
    setError(null);
    setFieldErrors({ email: '', password: '' });
    const email = form.email.trim();
    const password = form.password;

    if (validate && !email) {
      setFieldError('email', '이메일을 입력해주세요.');
      return;
    }
    if (validate && !password) {
      setFieldError('password', '비밀번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
      const from = location.state?.from || getAuthResumePath() || '/';
      navigate(from, { replace: true });
    } catch (err) {
      const isLoginFail =
        err?.errorCode === 'COMMON_400' || err?.status === 400;
      if (isLoginFail) {
        // 필드별 개별 메시지
        setFieldErrors({
          email: '이메일을 확인해주세요.',
          password: '비밀번호를 확인해주세요.',
        });
        requestAnimationFrame(() => focusField('email'));
      } else {
        // 서버/네트워크 오류만 ErrorActionNotice 표시
        const normalized = new Error(
          toKoreanMessage(
            err,
            '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
          )
        );
        normalized.status = err?.status;
        normalized.errorCode = err?.errorCode;
        normalized.response = err?.response;
        normalized.data = err?.data;
        normalized.code = err?.code;
        setError(normalized);
        requestAnimationFrame(() => errorRef.current?.focus());
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await runLogin({ validate: true });
  };

  const backendBaseUrl = getAppConfigValue(
    'BACKEND_BASE_URL',
    process.env.REACT_APP_BACKEND_BASE_URL || '/api'
  );

  const goSignup = () => navigate('/signup');
  const goFind = () => navigate('/find-account');
  const goKakao = () => {
    localStorage.removeItem('oauth_return_to');
    window.location.href = `${backendBaseUrl}/oauth2/authorization/kakao`;
  };
  const goGoogle = () => {
    localStorage.removeItem('oauth_return_to');
    window.location.href = `${backendBaseUrl}/oauth2/authorization/google`;
  };

  const onFaceSuccess = async () => {
    setFaceModal(false);
    try {
      await refresh();
      const from = location.state?.from || getAuthResumePath() || '/';
      navigate(from, { replace: true });
    } catch {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <div className={styles.cardWrap}>
          <section className={styles.card}>
            {/* 브랜드 */}
            <div className={styles.brand}>
              <p className={styles.welcome}>WELCOME TO</p>
              <div className={styles.brandLine} aria-hidden="true" />
              <h1 className={styles.brandName}>UNI-PLACE</h1>
              <h2 className={styles.title}>로그인</h2>
            </div>

            <form className={styles.form} onSubmit={onSubmit} noValidate>
              {notice ? (
                <div className={styles.notice} role="status" aria-live="polite">
                  {notice}
                </div>
              ) : null}

              {error ? (
                <div ref={errorRef} tabIndex={-1}>
                  <ErrorActionNotice
                    error={error}
                    fallback="로그인에 실패했습니다. 잠시 후 다시 시도해주세요."
                    onRetry={() => runLogin({ validate: false })}
                    hideTitle
                    className={styles.errorNotice}
                  />
                </div>
              ) : null}

              {/* ID */}
              <div
                className={`${styles.row} ${fieldErrors.email ? styles.rowError : ''}`}
              >
                <label className={styles.tag} htmlFor="login-email">
                  Email
                </label>
                <div className={styles.fieldWrap}>
                  <input
                    id="login-email"
                    ref={emailInputRef}
                    className={styles.input}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="이메일을 입력해주세요."
                    autoComplete="email"
                    disabled={loading || submitting}
                    aria-invalid={Boolean(fieldErrors.email)}
                    required
                  />
                </div>
              </div>
              {fieldErrors.email ? (
                <p className={styles.fieldError} role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}

              {/* PW */}
              <div
                className={`${styles.row} ${fieldErrors.password ? styles.rowError : ''}`}
              >
                <label className={styles.tag} htmlFor="login-password">
                  PW
                </label>
                <div className={styles.fieldWrap}>
                  <input
                    id="login-password"
                    ref={passwordInputRef}
                    className={styles.input}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="비밀번호를 입력해주세요."
                    autoComplete="current-password"
                    disabled={loading || submitting}
                    aria-invalid={Boolean(fieldErrors.password)}
                    required
                  />
                </div>
              </div>
              {fieldErrors.password ? (
                <p className={styles.fieldError} role="alert">
                  {fieldErrors.password}
                </p>
              ) : null}

              {/* 로그인 버튼 */}
              <button
                className={styles.submit}
                type="submit"
                disabled={loading || submitting}
              >
                {submitting ? '로그인 중…' : '로그인'}
              </button>

              {/* 회원가입 / 찾기 */}
              <div className={styles.actions}>
                <button
                  className={styles.subBtn}
                  type="button"
                  onClick={goSignup}
                  disabled={loading || submitting}
                >
                  회원가입
                </button>
                <button
                  className={styles.subBtn}
                  type="button"
                  onClick={goFind}
                  disabled={loading || submitting}
                >
                  ID / PW 찾기
                </button>
              </div>

              <div className={styles.divider}>
                <span>또는</span>
              </div>

              <button
                className={`${styles.socialBtn} ${styles.kakao}`}
                type="button"
                onClick={goKakao}
                disabled={loading || submitting}
              >
                카카오톡으로 로그인
              </button>
              <button
                className={`${styles.socialBtn} ${styles.google}`}
                type="button"
                onClick={goGoogle}
                disabled={loading || submitting}
              >
                Google 계정으로 로그인
              </button>

              <div className={styles.divider}>
                <span>또는</span>
              </div>

              <button
                className={`${styles.socialBtn} ${styles.faceBtn}`}
                type="button"
                onClick={() => setFaceModal(true)}
                disabled={loading || submitting}
              >
                <span className={styles.faceBtnIcon}>👤</span>
                얼굴 인식으로 로그인
              </button>
            </form>
          </section>
        </div>
      </main>

      {faceModal && (
        <FaceLoginModal
          mode="login"
          onSuccess={onFaceSuccess}
          onClose={() => setFaceModal(false)}
        />
      )}
    </div>
  );
}
