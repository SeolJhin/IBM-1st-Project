import React, { useState } from 'react';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', password2: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    const password = form.password;
    const password2 = form.password2;

    if (!email) return setError('이메일을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');
    if (password !== password2)
      return setError('비밀번호가 일치하지 않습니다.');

    try {
      setSubmitting(true);
      await authApi.signup({ userEmail: email, userPwd: password });
      setDone(true);
    } catch (err) {
      setError(err?.message || '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className={styles.container}>
        <h1 className={styles.title}>회원가입 완료</h1>
        <p className={styles.desc}>이제 로그인할 수 있어요.</p>
        <a className={styles.link} href="/login">
          로그인으로 이동
        </a>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>회원가입</h1>

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
            disabled={submitting}
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
            autoComplete="new-password"
            disabled={submitting}
            required
          />
        </label>

        <label className={styles.label}>
          <span>비밀번호 확인</span>
          <input
            className={styles.input}
            type="password"
            name="password2"
            value={form.password2}
            onChange={onChange}
            placeholder="비밀번호를 한번 더 입력해주세요."
            autoComplete="new-password"
            disabled={submitting}
            required
          />
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting ? '처리 중…' : '회원가입'}
        </button>
      </form>
    </section>
  );
}
