import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      // TODO: 프로젝트 라우팅 정책에 맞게 변경
      window.location.assign('/');
    } catch (err) {
      setError(err?.message || '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>로그인</h1>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          <span>이메일</span>
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

        <label className={styles.label}>
          <span>비밀번호</span>
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
      </form>
    </section>
  );
}
