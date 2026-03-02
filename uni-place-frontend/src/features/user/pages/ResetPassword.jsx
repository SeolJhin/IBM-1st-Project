import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { authApi } from '../api/authApi';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import styles from './ResetPassword.module.css';

const STATUS = {
  VERIFYING: 'verifying', // 토큰 검증 중
  VALID: 'valid', // 토큰 유효 → 새 비밀번호 입력
  INVALID: 'invalid', // 토큰 만료 or 무효
  DONE: 'done', // 변경 완료
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

  // ── 페이지 진입 시 토큰 유효성 확인
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

  // ── 새 비밀번호 제출
  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.newPassword) return setFormError('새 비밀번호를 입력해주세요.');
    if (form.newPassword.length < 8)
      return setFormError('비밀번호는 최소 8자 이상이어야 합니다.');
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

          {/* 검증 중 */}
          {status === STATUS.VERIFYING && (
            <p className={styles.loadingText}>링크를 확인하고 있습니다…</p>
          )}

          {/* 토큰 무효 */}
          {status === STATUS.INVALID && (
            <div className={styles.invalidBox}>
              <div className={styles.invalidIcon}>⚠️</div>
              <p className={styles.invalidMsg}>{tokenError}</p>
              <Link to="/find-account" className={styles.linkBtn}>
                재설정 링크 다시 받기
              </Link>
            </div>
          )}

          {/* 새 비밀번호 입력 */}
          {status === STATUS.VALID && (
            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.row}>
                <span className={styles.tag}>새 비밀번호</span>
                <input
                  className={styles.input}
                  type="password"
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="8자 이상"
                  disabled={submitting}
                  autoComplete="new-password"
                />
              </div>

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

          {/* 변경 완료 */}
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
