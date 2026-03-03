import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';

export default function Signup() {
  const [form, setForm] = useState({
    userNm: '',
    userEmail: '',
    userPwd: '',
    userPwd2: '',
    userBirth: '',
    userTel: '',
    userNickname: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState(''); // '' | 'checking' | 'ok' | 'dup' | 'error'
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    if (!nickname) return setError('닉네임을 입력해주세요.');
    if (nickname.length < 2 || nickname.length > 20)
      return setError('닉네임은 2~20자로 입력해주세요.');
    setNicknameStatus('checking');
    setError('');
    try {
      const available = await authApi.checkNickname(nickname);
      if (available) {
        setNicknameStatus('ok');
        setNicknameChecked(true);
      } else {
        setNicknameStatus('dup');
        setNicknameChecked(false);
      }
    } catch {
      setNicknameStatus('dup');
      setNicknameChecked(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const {
      userNm,
      userEmail,
      userPwd,
      userPwd2,
      userBirth,
      userTel,
      userNickname,
    } = form;

    if (!userNm.trim()) return setError('이름을 입력해주세요.');
    if (!userNickname.trim()) return setError('닉네임을 입력해주세요.');
    if (!nicknameChecked) return setError('닉네임 중복 확인을 해주세요.');
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
        userNickname: userNickname.trim(),
        userEmail: userEmail.trim(),
        userPwd,
        userBirth,
        userTel: userTel.trim(),
      });

      setDone(true);
    } catch (err) {
      setError(
        toKoreanMessage(
          err,
          '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
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
                  <div className={styles.tag}>닉네임</div>
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      name="userNickname"
                      value={form.userNickname}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="2~20자"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={checkNickname}
                      disabled={submitting || nicknameStatus === 'checking'}
                      style={{
                        padding: '0 14px',
                        borderRadius: 8,
                        background: nicknameChecked ? '#22c55e' : '#111',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {nicknameStatus === 'checking'
                        ? '확인 중…'
                        : nicknameChecked
                          ? '✓ 사용가능'
                          : '중복확인'}
                    </button>
                  </div>
                </div>
                {nicknameStatus === 'dup' && (
                  <div className={styles.error}>
                    이미 사용 중인 닉네임입니다.
                  </div>
                )}
                {nicknameStatus === 'ok' && (
                  <div
                    style={{ color: '#22c55e', fontSize: 13, marginBottom: 4 }}
                  >
                    사용 가능한 닉네임입니다.
                  </div>
                )}

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
