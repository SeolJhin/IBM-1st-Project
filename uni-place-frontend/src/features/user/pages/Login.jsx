import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../hooks/useAuth';
import Header from '../../../app/layouts/components/Header';

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

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
      setError(err?.message || '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ 버튼만 존재(기능 없음) / 나중에 연결
  const goSignup = () => navigate('/signup');
  const goFind = () => alert('ID/PW 찾기 기능은 추후 연결 예정입니다.');
  const goKakao = () => {
    // 소셜 로그인 연결 시, 백엔드 OAuth 엔드포인트로 이동
    // 예: window.location.href = "/oauth2/authorization/kakao" 또는 "/auth/oauth2/kakao"
    alert('카카오 로그인은 추후 연결 예정입니다.');
  };
  const goGoogle = () => {
    alert('Google 로그인은 추후 연결 예정입니다.');
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
          </form>
        </section>
      </main>
    </div>
  );
}
