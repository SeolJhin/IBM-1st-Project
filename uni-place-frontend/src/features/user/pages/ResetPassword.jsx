import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { authApi } from '../api/authApi';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import styles from './ResetPassword.module.css';
import { validatePassword } from '../../../shared/utils/validators';

const STATUS = {
  VERIFYING: 'verifying',
  VALID: 'valid',
  INVALID: 'invalid',
  DONE: 'done',
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status, setStatus] = useState(STATUS.VERIFYING);
  const [tokenError, setTokenError] = useState('');
  const [form, setForm] = useState({ newPassword: '', newPassword2: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 비밀번호 조건 실시간 체크
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    if (!token) {
      setTokenError('재설정 링크가 올바르지 않습니다.');
      setStatus(STATUS.INVALID);
      return;
    }
    authApi
      .verifyPasswordResetToken(token)
      .then(() => setStatus(STATUS.VALID))
      .catch((err) => {
        setTokenError(toKoreanMessage(err, '유효하지 않은 링크입니다.'));
        setStatus(STATUS.INVALID);
      });
  }, [token]);

  const onPwdChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, newPassword: val }));
    setPwdChecks({
      length: val.length >= 8,
      letter: /[a-zA-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val),
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const pwdErr = validatePassword(form.newPassword);
    if (pwdErr) return setFormError(pwdErr);
    if (form.newPassword !== form.newPassword2)
      return setFormError('비밀번호가 일치하지 않습니다.');

    try {
      setSubmitting(true);
      await authApi.confirmPasswordReset({
        token,
        newPassword: form.newPassword,
      });
      setStatus(STATUS.DONE);
    } catch (err) {
      setFormError(toKoreanMessage(err, '비밀번호 변경에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const pwdRules = [
    { key: 'length', label: '8자 이상' },
    { key: 'letter', label: '영문자' },
    { key: 'number', label: '숫자' },
    { key: 'special', label: '특수기호' },
  ];

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <section className={styles.card}>
          <div className={styles.brand}>
            <p className={styles.welcome}>WELCOME TO</p>
            <h1 className={styles.brandName}>UNI-PLACE</h1>
            <h2 className={styles.title}>비밀번호 재설정</h2>
          </div>

          {status === STATUS.VERIFYING && (
            <p className={styles.loadingText}>링크를 확인하고 있습니다…</p>
          )}

          {status === STATUS.INVALID && (
            <div className={styles.invalidBox}>
              <div className={styles.invalidIcon}>⚠️</div>
              <p className={styles.invalidMsg}>{tokenError}</p>
              <Link to="/find-account" className={styles.linkBtn}>
                재설정 링크 다시 받기
              </Link>
            </div>
          )}

          {status === STATUS.VALID && (
            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.row}>
                <span className={styles.tag}>새 비밀번호</span>
                <input
                  className={styles.input}
                  type="password"
                  value={form.newPassword}
                  onChange={onPwdChange}
                  placeholder="영문 + 숫자 + 특수기호 포함 8자 이상"
                  disabled={submitting}
                  autoComplete="new-password"
                />
              </div>

              {/* 비밀번호 조건 실시간 */}
              {form.newPassword && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px 12px',
                    marginBottom: 10,
                    paddingLeft: 2,
                  }}
                >
                  {pwdRules.map(({ key, label }) => (
                    <span
                      key={key}
                      style={{
                        fontSize: 12,
                        color: pwdChecks[key] ? '#22c55e' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {pwdChecks[key] ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.row}>
                <span className={styles.tag}>비밀번호 확인</span>
                <input
                  className={styles.input}
                  type="password"
                  value={form.newPassword2}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, newPassword2: e.target.value }))
                  }
                  placeholder="비밀번호를 한 번 더 입력"
                  disabled={submitting}
                  autoComplete="new-password"
                />
              </div>
              {form.newPassword2 && form.newPassword !== form.newPassword2 && (
                <div className={styles.error}>
                  비밀번호가 일치하지 않습니다.
                </div>
              )}

              {formError && <div className={styles.error}>{formError}</div>}

              <button
                className={styles.submit}
                type="submit"
                disabled={submitting}
              >
                {submitting ? '변경 중…' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {status === STATUS.DONE && (
            <div className={styles.doneBox}>
              <div className={styles.doneIcon}>✅</div>
              <p className={styles.doneTitle}>비밀번호가 변경되었습니다</p>
              <p className={styles.doneDesc}>새 비밀번호로 로그인해주세요.</p>
              <button
                className={styles.submit}
                type="button"
                onClick={() => navigate('/login')}
              >
                로그인하러 가기
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
