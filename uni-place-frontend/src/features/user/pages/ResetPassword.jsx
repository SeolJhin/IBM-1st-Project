import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { authApi } from '../api/authApi';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import styles from './ResetPassword.module.css';
import { validatePassword } from '../../../shared/utils/validators';

const STATUS = { VERIFYING: 'verifying', VALID: 'valid', INVALID: 'invalid', DONE: 'done' };

const PWD_RULES = [
  { key: 'length',  label: '8자 이상' },
  { key: 'letter',  label: '영문자' },
  { key: 'number',  label: '숫자' },
  { key: 'special', label: '특수기호' },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token    = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [status,    setStatus]    = useState(STATUS.VERIFYING);
  const [tokenError, setTokenError] = useState('');
  const [form,      setForm]      = useState({ newPassword: '', newPassword2: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [pwdChecks,  setPwdChecks]  = useState({ length: false, letter: false, number: false, special: false });

  useEffect(() => {
    if (!token) { setTokenError('재설정 링크가 올바르지 않습니다.'); setStatus(STATUS.INVALID); return; }
    authApi.verifyPasswordResetToken(token)
      .then(() => setStatus(STATUS.VALID))
      .catch((err) => { setTokenError(toKoreanMessage(err, '유효하지 않은 링크입니다.')); setStatus(STATUS.INVALID); });
  }, [token]);

  const onPwdChange = (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, newPassword: val }));
    setPwdChecks({
      length:  val.length >= 8,
      letter:  /[a-zA-Z]/.test(val),
      number:  /[0-9]/.test(val),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(val),
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    const pwdErr = validatePassword(form.newPassword);
    if (pwdErr) return setFormError(pwdErr);
    if (form.newPassword !== form.newPassword2) return setFormError('비밀번호가 일치하지 않습니다.');
    try {
      setSubmitting(true);
      await authApi.confirmPasswordReset({ token, newPassword: form.newPassword });
      setStatus(STATUS.DONE);
    } catch (err) {
      setFormError(toKoreanMessage(err, '비밀번호 변경에 실패했습니다.'));
    } finally { setSubmitting(false); }
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
            <h2 className={styles.title}>비밀번호 재설정</h2>
          </div>

          {/* 로딩 */}
          {status === STATUS.VERIFYING && (
            <p className={styles.loadingText}>링크를 확인하고 있습니다…</p>
          )}

          {/* 링크 무효 */}
          {status === STATUS.INVALID && (
            <div className={styles.invalidBox}>
              <div className={styles.invalidIcon}>⚠️</div>
              <p className={styles.invalidMsg}>{tokenError}</p>
              <Link to="/find-account" className={styles.linkBtn}>재설정 링크 다시 받기</Link>
            </div>
          )}

          {/* 폼 */}
          {status === STATUS.VALID && (
            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.row}>
                <span className={styles.tag}>새 비밀번호</span>
                <input className={styles.input} type="password"
                  value={form.newPassword} onChange={onPwdChange}
                  placeholder="영문 + 숫자 + 특수기호 8자 이상"
                  disabled={submitting} autoComplete="new-password" />
              </div>

              {/* 비밀번호 조건 — CSS Module 클래스 (inline style 완전 제거) */}
              {form.newPassword && (
                <div className={styles.pwdRules} aria-live="polite">
                  {PWD_RULES.map(({ key, label }) => (
                    <span key={key} className={`${styles.pwdRule} ${pwdChecks[key] ? styles.pwdRuleOk : ''}`}>
                      <span aria-hidden="true">{pwdChecks[key] ? '✓' : '•'}</span>{label}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.row}>
                <span className={styles.tag}>비밀번호 확인</span>
                <input className={styles.input} type="password"
                  value={form.newPassword2}
                  onChange={(e) => setForm((p) => ({ ...p, newPassword2: e.target.value }))}
                  placeholder="비밀번호를 한 번 더 입력"
                  disabled={submitting} autoComplete="new-password" />
              </div>

              {form.newPassword2 && form.newPassword !== form.newPassword2 && (
                <p className={styles.fieldError} role="alert">비밀번호가 일치하지 않습니다.</p>
              )}
              {formError && <p className={styles.fieldError} role="alert">{formError}</p>}

              <button className={styles.submit} type="submit" disabled={submitting}>
                {submitting ? '변경 중…' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {/* 완료 */}
          {status === STATUS.DONE && (
            <div className={styles.doneBox}>
              <div className={styles.doneIcon}>✅</div>
              <p className={styles.doneTitle}>비밀번호가 변경되었습니다</p>
              <p className={styles.doneDesc}>새 비밀번호로 로그인해주세요.</p>
              <button className={styles.submit} type="button" onClick={() => navigate('/login')}>
                로그인하러 가기
              </button>
            </div>
          )}

        </section>
        </div>
      </main>
    </div>
  );
}
