import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';

// ✅ Header 경로는 Login.jsx에서 쓰는 것과 동일하게 맞춰줘!
import Header from '../../../app/layouts/components/Header';

export default function Signup() {
  const [form, setForm] = useState({
    userNm: '',
    userEmail: '',
    userPwd: '',
    userPwd2: '',
    userBirth: '',
    userTel: '',
  });

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

    const { userNm, userEmail, userPwd, userPwd2, userBirth, userTel } = form;

    // ✅ 프론트 단 기본 검증
    if (!userNm.trim()) return setError('이름을 입력해주세요.');
    if (!userEmail.trim()) return setError('이메일을 입력해주세요.');
    if (!userPwd) return setError('비밀번호를 입력해주세요.');
    if (userPwd.length < 8)
      return setError('비밀번호는 최소 8자 이상이어야 합니다.');
    if (userPwd !== userPwd2) return setError('비밀번호가 일치하지 않습니다.');
    if (!userBirth) return setError('생년월일을 입력해주세요.');
    if (!userTel.trim()) return setError('전화번호를 입력해주세요.');

    try {
      setSubmitting(true);

      await authApi.signup({
        userNm: userNm.trim(),
        userEmail: userEmail.trim(),
        userPwd,
        userBirth, // type="date" -> yyyy-MM-dd
        userTel: userTel.trim(),
      });

      setDone(true);
    } catch (err) {
      // ✅ 백엔드 ErrorCode 기반 UX 처리
      // DUPLICATE_EMAIL(HttpStatus.CONFLICT, "USER_409_1", "이미 사용 중인 이메일입니다.")
      if (err?.status === 409 && err?.errorCode === 'USER_409_1') {
        setError('이미 사용 중인 이메일입니다.');
        return;
      }

      // (선택) 전화번호 중복도 같은 패턴이면 여기에 추가
      // 예: DUPLICATE_TEL => "USER_409_2" 라면:
      // if (err?.status === 409 && err?.errorCode === "USER_409_2") {
      //   setError("이미 사용 중인 전화번호입니다.");
      //   return;
      // }

      setError(err?.message || '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        <section className={styles.card}>
          {done ? (
            <>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>회원가입 완료</h2>
              </div>

              <p className={styles.desc}>이제 로그인할 수 있어요.</p>

              <Link to="/login" className={styles.primaryLink}>
                로그인으로 이동
              </Link>
            </>
          ) : (
            <>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>회원가입</h2>
              </div>

              <form className={styles.form} onSubmit={onSubmit}>
                <div className={styles.row}>
                  <div className={styles.tag}>이름</div>
                  <input
                    className={styles.input}
                    name="userNm"
                    value={form.userNm}
                    onChange={onChange}
                    disabled={submitting}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.tag}>이메일</div>
                  <input
                    className={styles.input}
                    type="email"
                    name="userEmail"
                    value={form.userEmail}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="example@domain.com"
                    autoComplete="email"
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.tag}>비밀번호</div>
                  <input
                    className={styles.input}
                    type="password"
                    name="userPwd"
                    value={form.userPwd}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="8자 이상"
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.tag}>비밀번호 확인</div>
                  <input
                    className={styles.input}
                    type="password"
                    name="userPwd2"
                    value={form.userPwd2}
                    onChange={onChange}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.tag}>생년월일</div>
                  <input
                    className={styles.input}
                    type="date"
                    name="userBirth"
                    value={form.userBirth}
                    onChange={onChange}
                    disabled={submitting}
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.tag}>전화번호</div>
                  <input
                    className={styles.input}
                    name="userTel"
                    value={form.userTel}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="010-1234-5678"
                    autoComplete="tel"
                  />
                </div>

                {error ? <div className={styles.error}>{error}</div> : null}

                <button
                  className={styles.submit}
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? '처리 중…' : '회원가입'}
                </button>

                <div className={styles.bottomLinks}>
                  <span className={styles.hint}>이미 계정이 있나요?</span>
                  <Link className={styles.link} to="/login">
                    로그인
                  </Link>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
