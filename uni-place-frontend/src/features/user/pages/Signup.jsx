import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import {
  validatePassword,
  validateEmail,
  validatePhone,
  validateName,
  validateNickname,
} from '../../../shared/utils/validators';

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
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);

  // 실시간 비밀번호 검사 상태
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
  });

  // 이메일 인증 상태
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCodeStatus, setEmailCodeStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
    }
    if (name === 'userEmail') {
      setEmailCodeSent(false);
      setEmailVerified(false);
      setEmailCodeStatus('');
      setEmailCodeInput('');
    }
    if (name === 'userPwd') {
      setPwdChecks({
        length: value.length >= 8,
        letter: /[a-zA-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(value),
      });
    }
  };

  // 쿨타임
  const cooldownRef = useRef(null);
  const startCooldown = (seconds) => {
    setCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const sendEmailCode = async () => {
    const email = form.userEmail.trim();
    if (!email) return setError('이메일을 입력해주세요.');
    const emailErr = validateEmail(email);
    if (emailErr) return setError(emailErr);
    if (cooldown > 0) return;
    setEmailCodeStatus('sending');
    setError('');
    try {
      await authApi.sendEmailCode({ userEmail: email });
      setEmailCodeSent(true);
      setEmailVerified(false);
      setEmailCodeStatus('');
      startCooldown(60);
    } catch (err) {
      setEmailCodeStatus('');
      setError(toKoreanMessage(err, '인증코드 발송에 실패했습니다.'));
    }
  };

  const verifyEmailCode = async () => {
    const email = form.userEmail.trim();
    if (!emailCodeInput.trim()) return setError('인증코드를 입력해주세요.');
    setEmailCodeStatus('verifying');
    setError('');
    try {
      await authApi.verifyEmailCode({
        userEmail: email,
        code: emailCodeInput.trim(),
      });
      setEmailVerified(true);
      setEmailCodeStatus('ok');
    } catch (err) {
      setEmailCodeStatus('fail');
      setEmailVerified(false);
      setError(toKoreanMessage(err, '인증코드가 올바르지 않습니다.'));
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    const nickErr = validateNickname(nickname);
    if (nickErr) return setError(nickErr);
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

    // 이름
    const nameErr = validateName(userNm);
    if (nameErr) return setError(nameErr);

    // 닉네임
    const nickErr = validateNickname(userNickname);
    if (nickErr) return setError(nickErr);
    if (!nicknameChecked) return setError('닉네임 중복 확인을 해주세요.');

    // 이메일
    const emailErr = validateEmail(userEmail);
    if (emailErr) return setError(emailErr);
    if (!emailVerified) return setError('이메일 인증을 완료해주세요.');

    // 비밀번호
    const pwdErr = validatePassword(userPwd);
    if (pwdErr) return setError(pwdErr);
    if (userPwd !== userPwd2) return setError('비밀번호가 일치하지 않습니다.');

    // 생년월일
    if (!userBirth) return setError('생년월일을 입력해주세요.');
    const today = new Date().toISOString().slice(0, 10);
    if (userBirth >= today) return setError('생년월일이 올바르지 않습니다.');

    // 전화번호
    const telErr = validatePhone(userTel);
    if (telErr) return setError(telErr);

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

  // 비밀번호 조건 체크 아이템
  const pwdRules = [
    { key: 'length', label: '8자 이상' },
    { key: 'letter', label: '영문자 포함' },
    { key: 'number', label: '숫자 포함' },
    { key: 'special', label: '특수기호 포함 (!@#$% 등)' },
  ];

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
                {/* 이름 */}
                <div className={styles.row}>
                  <div className={styles.tag}>이름</div>
                  <input
                    className={styles.input}
                    name="userNm"
                    value={form.userNm}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="실명을 입력해주세요"
                  />
                </div>

                {/* 닉네임 */}
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

                {/* 이메일 */}
                <div className={styles.row}>
                  <div className={styles.tag}>이메일</div>
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <input
                      className={styles.input}
                      style={{ flex: 1 }}
                      type="email"
                      name="userEmail"
                      value={form.userEmail}
                      onChange={onChange}
                      disabled={submitting || emailVerified}
                      placeholder="example@domain.com"
                      autoComplete="email"
                    />
                    <button
                      type="button"
                      onClick={sendEmailCode}
                      disabled={
                        submitting ||
                        emailCodeStatus === 'sending' ||
                        emailVerified ||
                        cooldown > 0
                      }
                      style={{
                        padding: '0 14px',
                        borderRadius: 8,
                        background: emailVerified ? '#22c55e' : '#111',
                        color: '#fff',
                        border: 'none',
                        cursor: emailVerified ? 'default' : 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {emailVerified
                        ? '✓ 인증완료'
                        : emailCodeStatus === 'sending'
                          ? '발송 중…'
                          : cooldown > 0
                            ? `재발송 (${cooldown}초)`
                            : emailCodeSent
                              ? '재발송'
                              : '인증코드 받기'}
                    </button>
                  </div>
                </div>
                {emailCodeSent && !emailVerified && (
                  <div className={styles.row}>
                    <div className={styles.tag}>인증코드</div>
                    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                      <input
                        className={styles.input}
                        style={{ flex: 1, letterSpacing: 4, fontWeight: 600 }}
                        value={emailCodeInput}
                        onChange={(e) => setEmailCodeInput(e.target.value)}
                        placeholder="6자리 숫자"
                        maxLength={6}
                        disabled={submitting || emailCodeStatus === 'verifying'}
                      />
                      <button
                        type="button"
                        onClick={verifyEmailCode}
                        disabled={submitting || emailCodeStatus === 'verifying'}
                        style={{
                          padding: '0 14px',
                          borderRadius: 8,
                          background:
                            emailCodeStatus === 'fail' ? '#ef4444' : '#c8932a',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {emailCodeStatus === 'verifying' ? '확인 중…' : '확인'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 비밀번호 */}
                <div className={styles.row}>
                  <div className={styles.tag}>비밀번호</div>
                  <input
                    className={styles.input}
                    type="password"
                    name="userPwd"
                    value={form.userPwd}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="영문 + 숫자 + 특수기호 포함 8자 이상"
                    autoComplete="new-password"
                  />
                </div>
                {/* 비밀번호 조건 실시간 표시 */}
                {form.userPwd && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px 14px',
                      marginBottom: 8,
                      paddingLeft: 4,
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

                {/* 비밀번호 확인 */}
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
                {form.userPwd2 && form.userPwd !== form.userPwd2 && (
                  <div className={styles.error}>
                    비밀번호가 일치하지 않습니다.
                  </div>
                )}
                {form.userPwd2 &&
                  form.userPwd === form.userPwd2 &&
                  form.userPwd2.length > 0 && (
                    <div
                      style={{
                        color: '#22c55e',
                        fontSize: 13,
                        marginBottom: 4,
                      }}
                    >
                      비밀번호가 일치합니다.
                    </div>
                  )}

                {/* 생년월일 */}
                <div className={styles.row}>
                  <div className={styles.tag}>생년월일</div>
                  <input
                    className={styles.input}
                    type="date"
                    name="userBirth"
                    value={form.userBirth}
                    onChange={onChange}
                    disabled={submitting}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>

                {/* 전화번호 */}
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
                    maxLength={13}
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
