import React, { useEffect, useRef, useState } from 'react';
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

const INITIAL_FORM = {
  userNm: '',
  userEmail: '',
  userPwd: '',
  userPwd2: '',
  userBirth: '',
  userTel: '',
  userNickname: '',
};

const PWD_RULES = [
  { key: 'length', label: '8자 이상' },
  { key: 'letter', label: '영문 포함' },
  { key: 'number', label: '숫자 포함' },
  { key: 'special', label: '특수문자 포함' },
];

export default function Signup() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [done, setDone] = useState(false);

  const [nicknameStatus, setNicknameStatus] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
  });

  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCodeStatus, setEmailCodeStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef(null);
  const summaryRef = useRef(null);
  const fieldRefs = useRef({});

  const setFieldRef = (name) => (el) => {
    fieldRefs.current[name] = el;
  };

  const clearFieldError = (name) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const focusField = (name) => {
    requestAnimationFrame(() => fieldRefs.current[name]?.focus?.());
  };

  const setFieldError = (name, message) => {
    setFieldErrors((prev) => ({ ...prev, [name]: message }));
    setError(message);
    focusField(name);
  };

  const setGlobalError = (message) => {
    setError(message);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const resetAllErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);

    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
    }

    if (name === 'userEmail') {
      setEmailCodeSent(false);
      setEmailVerified(false);
      setEmailCodeStatus('');
      setEmailCodeInput('');
      clearFieldError('emailCode');
    }

    if (name === 'userPwd') {
      setPwdChecks({
        length: value.length >= 8,
        letter: /[a-zA-Z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value),
      });
    }
  };

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
    clearFieldError('userEmail');

    if (!email) {
      setFieldError('userEmail', '이메일을 입력해주세요.');
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldError('userEmail', emailErr);
      return;
    }

    if (cooldown > 0) return;

    setEmailCodeStatus('sending');
    setError('');

    try {
      await authApi.sendEmailCode({ userEmail: email });
      setEmailCodeSent(true);
      setEmailVerified(false);
      setEmailCodeStatus('');
      clearFieldError('emailCode');
      startCooldown(60);
    } catch (err) {
      setEmailCodeStatus('');
      setFieldError('userEmail', toKoreanMessage(err, '인증코드 발송에 실패했습니다.'));
    }
  };

  const verifyEmailCode = async () => {
    const email = form.userEmail.trim();
    const code = emailCodeInput.trim();
    clearFieldError('emailCode');

    if (!code) {
      setFieldError('emailCode', '인증코드를 입력해주세요.');
      return;
    }

    setEmailCodeStatus('verifying');
    setError('');

    try {
      await authApi.verifyEmailCode({ userEmail: email, code });
      setEmailVerified(true);
      setEmailCodeStatus('ok');
      clearFieldError('emailCode');
    } catch (err) {
      setEmailCodeStatus('fail');
      setEmailVerified(false);
      setFieldError(
        'emailCode',
        toKoreanMessage(err, '인증코드가 올바르지 않습니다.')
      );
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    clearFieldError('userNickname');

    const nickErr = validateNickname(nickname);
    if (nickErr) {
      setFieldError('userNickname', nickErr);
      return;
    }

    setNicknameStatus('checking');
    setError('');

    try {
      const available = await authApi.checkNickname(nickname);
      if (available) {
        setNicknameStatus('ok');
        setNicknameChecked(true);
        clearFieldError('userNickname');
      } else {
        setNicknameStatus('dup');
        setNicknameChecked(false);
        setFieldError('userNickname', '이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setNicknameStatus('dup');
      setNicknameChecked(false);
      setFieldError('userNickname', '닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    resetAllErrors();

    const {
      userNm,
      userEmail,
      userPwd,
      userPwd2,
      userBirth,
      userTel,
      userNickname,
    } = form;

    const nameErr = validateName(userNm);
    if (nameErr) {
      setFieldError('userNm', nameErr);
      return;
    }

    const nickErr = validateNickname(userNickname);
    if (nickErr) {
      setFieldError('userNickname', nickErr);
      return;
    }
    if (!nicknameChecked) {
      setFieldError('userNickname', '닉네임 중복 확인을 해주세요.');
      return;
    }

    const emailErr = validateEmail(userEmail);
    if (emailErr) {
      setFieldError('userEmail', emailErr);
      return;
    }
    if (!emailVerified) {
      setFieldError('emailCode', '이메일 인증을 완료해주세요.');
      return;
    }

    const pwdErr = validatePassword(userPwd);
    if (pwdErr) {
      setFieldError('userPwd', pwdErr);
      return;
    }
    if (userPwd !== userPwd2) {
      setFieldError('userPwd2', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!userBirth) {
      setFieldError('userBirth', '생년월일을 입력해주세요.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (userBirth >= today) {
      setFieldError('userBirth', '생년월일이 올바르지 않습니다.');
      return;
    }

    const telErr = validatePhone(userTel);
    if (telErr) {
      setFieldError('userTel', telErr);
      return;
    }

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
      setGlobalError(
        toKoreanMessage(err, '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
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

              <form className={styles.form} onSubmit={onSubmit} noValidate>
                {error ? (
                  <div
                    ref={summaryRef}
                    tabIndex={-1}
                    className={styles.error}
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </div>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userNm">
                    이름
                  </label>
                  <input
                    id="signup-userNm"
                    ref={setFieldRef('userNm')}
                    className={styles.input}
                    name="userNm"
                    value={form.userNm}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="실명을 입력해주세요"
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.userNm)}
                    aria-describedby={
                      fieldErrors.userNm ? 'signup-userNm-error' : undefined
                    }
                    required
                  />
                </div>
                {fieldErrors.userNm ? (
                  <p id="signup-userNm-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userNm}
                  </p>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userNickname">
                    닉네임
                  </label>
                  <div className={styles.inlineGroup}>
                    <input
                      id="signup-userNickname"
                      ref={setFieldRef('userNickname')}
                      className={styles.input}
                      name="userNickname"
                      value={form.userNickname}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="2~20자"
                      maxLength={20}
                      aria-invalid={Boolean(fieldErrors.userNickname)}
                      aria-describedby={
                        fieldErrors.userNickname ? 'signup-userNickname-error' : undefined
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={checkNickname}
                      disabled={submitting || nicknameStatus === 'checking'}
                      className={`${styles.inlineBtn} ${nicknameChecked ? styles.inlineBtnSuccess : ''}`}
                    >
                      {nicknameStatus === 'checking'
                        ? '확인 중…'
                        : nicknameChecked
                          ? '사용 가능'
                          : '중복확인'}
                    </button>
                  </div>
                </div>
                {fieldErrors.userNickname ? (
                  <p
                    id="signup-userNickname-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.userNickname}
                  </p>
                ) : null}
                {nicknameStatus === 'ok' ? (
                  <p className={styles.successText} role="status" aria-live="polite">
                    사용 가능한 닉네임입니다.
                  </p>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userEmail">
                    이메일
                  </label>
                  <div className={styles.inlineGroup}>
                    <input
                      id="signup-userEmail"
                      ref={setFieldRef('userEmail')}
                      className={styles.input}
                      type="email"
                      name="userEmail"
                      value={form.userEmail}
                      onChange={onChange}
                      disabled={submitting || emailVerified}
                      placeholder="example@domain.com"
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.userEmail)}
                      aria-describedby={
                        fieldErrors.userEmail ? 'signup-userEmail-error' : undefined
                      }
                      required
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
                      className={`${styles.inlineBtn} ${emailVerified ? styles.inlineBtnSuccess : ''}`}
                    >
                      {emailVerified
                        ? '인증완료'
                        : emailCodeStatus === 'sending'
                          ? '발송 중…'
                          : cooldown > 0
                            ? `재발송(${cooldown}초)`
                            : emailCodeSent
                              ? '재발송'
                              : '인증코드 받기'}
                    </button>
                  </div>
                </div>
                {fieldErrors.userEmail ? (
                  <p id="signup-userEmail-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userEmail}
                  </p>
                ) : null}

                {emailCodeSent && !emailVerified ? (
                  <>
                    <div className={styles.row}>
                      <label className={styles.tag} htmlFor="signup-emailCode">
                        인증코드
                      </label>
                      <div className={styles.inlineGroup}>
                        <input
                          id="signup-emailCode"
                          ref={setFieldRef('emailCode')}
                          className={styles.input}
                          value={emailCodeInput}
                          onChange={(e) => {
                            setEmailCodeInput(e.target.value);
                            clearFieldError('emailCode');
                          }}
                          placeholder="6자리 숫자"
                          maxLength={6}
                          disabled={submitting || emailCodeStatus === 'verifying'}
                          aria-invalid={Boolean(fieldErrors.emailCode)}
                          aria-describedby={
                            fieldErrors.emailCode ? 'signup-emailCode-error' : undefined
                          }
                        />
                        <button
                          type="button"
                          onClick={verifyEmailCode}
                          disabled={submitting || emailCodeStatus === 'verifying'}
                          className={`${styles.inlineBtn} ${emailCodeStatus === 'fail' ? styles.inlineBtnWarn : ''}`}
                        >
                          {emailCodeStatus === 'verifying' ? '확인 중…' : '확인'}
                        </button>
                      </div>
                    </div>
                    {fieldErrors.emailCode ? (
                      <p id="signup-emailCode-error" className={styles.fieldError} role="alert">
                        {fieldErrors.emailCode}
                      </p>
                    ) : null}
                  </>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userPwd">
                    비밀번호
                  </label>
                  <input
                    id="signup-userPwd"
                    ref={setFieldRef('userPwd')}
                    className={styles.input}
                    type="password"
                    name="userPwd"
                    value={form.userPwd}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="영문+숫자+특수문자 포함 8자 이상"
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.userPwd)}
                    aria-describedby={fieldErrors.userPwd ? 'signup-userPwd-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.userPwd ? (
                  <p id="signup-userPwd-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userPwd}
                  </p>
                ) : null}
                {form.userPwd ? (
                  <div className={styles.pwdRules} aria-live="polite">
                    {PWD_RULES.map(({ key, label }) => (
                      <span
                        key={key}
                        className={`${styles.pwdRule} ${pwdChecks[key] ? styles.pwdRuleOk : ''}`}
                      >
                        <span aria-hidden="true">{pwdChecks[key] ? '✓' : '•'}</span>
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userPwd2">
                    비밀번호 확인
                  </label>
                  <input
                    id="signup-userPwd2"
                    ref={setFieldRef('userPwd2')}
                    className={styles.input}
                    type="password"
                    name="userPwd2"
                    value={form.userPwd2}
                    onChange={onChange}
                    disabled={submitting}
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.userPwd2)}
                    aria-describedby={fieldErrors.userPwd2 ? 'signup-userPwd2-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.userPwd2 ? (
                  <p id="signup-userPwd2-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userPwd2}
                  </p>
                ) : null}
                {form.userPwd2 && form.userPwd === form.userPwd2 ? (
                  <p className={styles.successText} role="status" aria-live="polite">
                    비밀번호가 일치합니다.
                  </p>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userBirth">
                    생년월일
                  </label>
                  <input
                    id="signup-userBirth"
                    ref={setFieldRef('userBirth')}
                    className={styles.input}
                    type="date"
                    name="userBirth"
                    value={form.userBirth}
                    onChange={onChange}
                    disabled={submitting}
                    max={new Date().toISOString().slice(0, 10)}
                    aria-invalid={Boolean(fieldErrors.userBirth)}
                    aria-describedby={fieldErrors.userBirth ? 'signup-userBirth-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.userBirth ? (
                  <p id="signup-userBirth-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userBirth}
                  </p>
                ) : null}

                <div className={styles.row}>
                  <label className={styles.tag} htmlFor="signup-userTel">
                    전화번호
                  </label>
                  <input
                    id="signup-userTel"
                    ref={setFieldRef('userTel')}
                    className={styles.input}
                    name="userTel"
                    value={form.userTel}
                    onChange={onChange}
                    disabled={submitting}
                    placeholder="010-1234-5678"
                    autoComplete="tel"
                    maxLength={13}
                    aria-invalid={Boolean(fieldErrors.userTel)}
                    aria-describedby={fieldErrors.userTel ? 'signup-userTel-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.userTel ? (
                  <p id="signup-userTel-error" className={styles.fieldError} role="alert">
                    {fieldErrors.userTel}
                  </p>
                ) : null}

                <button className={styles.submit} type="submit" disabled={submitting}>
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
