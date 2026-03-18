import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../hooks/useAuth';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import FaceLoginModal from '../components/FaceLoginModal';

export default function Login() {
  const { login, loading, refresh } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [faceModal, setFaceModal] = useState(false); // 얼굴 인식 모달

  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message || '';

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    const password = form.password;

    if (!email) return setError('이메일을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    try {
      setSubmitting(true);
      await login({ email, password });

      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      // 백엔드는 보안상 USER_NOT_FOUND / PASSWORD_MISMATCH / LOCKED 모두 COMMON_400으로 통일
      const isLoginFail =
        err?.errorCode === 'COMMON_400' || err?.status === 400;
      setError(
        isLoginFail
          ? '이메일 또는 비밀번호를 확인해주세요.'
          : toKoreanMessage(
              err,
              '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
            )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const backendBaseUrl = process.env.REACT_APP_BACKEND_BASE_URL || '/api';

  // ✅ 버튼만 존재(기능 없음) / 나중에 연결
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

  // 얼굴 인식 성공 → FaceLoginModal이 이미 localStorage에 JWT 저장
  // → refresh(bootstrap)으로 user 상태 갱신 후 리다이렉트
  const onFaceSuccess = async () => {
    setFaceModal(false);
    try {
      await refresh();
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        <section className={styles.card}>
          <div className={styles.brand}>
            <p className={styles.welcome}>WELCOME TO</p>
            <h1 className={styles.brandName}>UNI-PLACE</h1>
            <h2 className={styles.title}>로그인</h2>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.row}>
              <span className={styles.tag}>ID</span>
              <input
                className={styles.input}
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="이메일을 입력해주세요."
                autoComplete="email"
                disabled={loading || submitting}
                required
              />
            </label>

            <label className={styles.row}>
              <span className={styles.tag}>PW</span>
              <input
                className={styles.input}
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="비밀번호를 입력해주세요."
                autoComplete="current-password"
                disabled={loading || submitting}
                required
              />
            </label>

            {notice ? <div className={styles.notice}>{notice}</div> : null}
            {error ? <div className={styles.error}>{error}</div> : null}

            <button
              className={styles.submit}
              type="submit"
              disabled={loading || submitting}
            >
              {submitting ? '로그인 중…' : '로그인'}
            </button>

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
                ID/PW 찾기
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
