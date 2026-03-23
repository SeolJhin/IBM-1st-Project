import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';
import Header from '../../../app/layouts/components/Header';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import {
  validatePassword, validateEmail, validatePhone,
  validateName, validateNickname,
} from '../../../shared/utils/validators';

const INITIAL_FORM = {
  userNm: '', userEmail: '', userPwd: '', userPwd2: '',
  userBirth: '', userTel: '', userNickname: '',
};

const PWD_RULES = [
  { key: 'length',  label: '8자 이상' },
  { key: 'letter',  label: '영문 포함' },
  { key: 'number',  label: '숫자 포함' },
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
  const [pwdChecks, setPwdChecks] = useState({ length: false, letter: false, number: false, special: false });
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCodeStatus, setEmailCodeStatus] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef(null);
  const summaryRef  = useRef(null);
  const fieldRefs   = useRef({});

  const setFieldRef    = (name) => (el) => { fieldRefs.current[name] = el; };
  const clearFieldError = (name) => setFieldErrors((prev) => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n; });
  const focusField     = (name) => requestAnimationFrame(() => fieldRefs.current[name]?.focus?.());
  const setFieldError  = (name, msg) => { setFieldErrors((p) => ({ ...p, [name]: msg })); setError(msg); focusField(name); };
  const setGlobalError = (msg) => { setError(msg); requestAnimationFrame(() => summaryRef.current?.focus()); };
  const resetAllErrors = () => { setError(''); setFieldErrors({}); };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    clearFieldError(name);
    if (name === 'userNickname') { setNicknameStatus(''); setNicknameChecked(false); }
    if (name === 'userEmail') { setEmailCodeSent(false); setEmailVerified(false); setEmailCodeStatus(''); setEmailCodeInput(''); clearFieldError('emailCode'); }
    if (name === 'userPwd') setPwdChecks({
      length:  value.length >= 8,
      letter:  /[a-zA-Z]/.test(value),
      number:  /[0-9]/.test(value),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(value),
    });
  };

  const startCooldown = (sec) => {
    setCooldown(sec);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => setCooldown((p) => { if (p <= 1) { clearInterval(cooldownRef.current); return 0; } return p - 1; }), 1000);
  };

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const sendEmailCode = async () => {
    const email = form.userEmail.trim();
    clearFieldError('userEmail');
    if (!email) { setFieldError('userEmail', '이메일을 입력해주세요.'); return; }
    const err = validateEmail(email);
    if (err) { setFieldError('userEmail', err); return; }
    if (cooldown > 0) return;
    setEmailCodeStatus('sending'); setError('');
    try {
      await authApi.sendEmailCode({ userEmail: email });
      setEmailCodeSent(true); setEmailVerified(false); setEmailCodeStatus(''); clearFieldError('emailCode'); startCooldown(60);
    } catch (e) { setEmailCodeStatus(''); setFieldError('userEmail', toKoreanMessage(e, '인증코드 발송에 실패했습니다.')); }
  };

  const verifyEmailCode = async () => {
    const code = emailCodeInput.trim();
    clearFieldError('emailCode');
    if (!code) { setFieldError('emailCode', '인증코드를 입력해주세요.'); return; }
    setEmailCodeStatus('verifying'); setError('');
    try {
      await authApi.verifyEmailCode({ userEmail: form.userEmail.trim(), code });
      setEmailVerified(true); setEmailCodeStatus('ok'); clearFieldError('emailCode');
    } catch (e) { setEmailCodeStatus('fail'); setEmailVerified(false); setFieldError('emailCode', toKoreanMessage(e, '인증코드가 올바르지 않습니다.')); }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    clearFieldError('userNickname');
    const nickErr = validateNickname(nickname);
    if (nickErr) { setFieldError('userNickname', nickErr); return; }
    setNicknameStatus('checking'); setError('');
    try {
      const ok = await authApi.checkNickname(nickname);
      if (ok) { setNicknameStatus('ok'); setNicknameChecked(true); clearFieldError('userNickname'); }
      else { setNicknameStatus('dup'); setNicknameChecked(false); setFieldError('userNickname', '이미 사용 중인 닉네임입니다.'); }
    } catch { setNicknameStatus('dup'); setNicknameChecked(false); setFieldError('userNickname', '닉네임 확인 중 오류가 발생했습니다.'); }
  };

  const onSubmit = async (e) => {
    e.preventDefault(); resetAllErrors();
    const { userNm, userEmail, userPwd, userPwd2, userBirth, userTel, userNickname } = form;

    const nameErr = validateName(userNm); if (nameErr) { setFieldError('userNm', nameErr); return; }
    const nickErr = validateNickname(userNickname); if (nickErr) { setFieldError('userNickname', nickErr); return; }
    if (!nicknameChecked) { setFieldError('userNickname', '닉네임 중복 확인을 해주세요.'); return; }
    const emailErr = validateEmail(userEmail); if (emailErr) { setFieldError('userEmail', emailErr); return; }
    if (!emailVerified) { setFieldError('emailCode', '이메일 인증을 완료해주세요.'); return; }
    const pwdErr = validatePassword(userPwd); if (pwdErr) { setFieldError('userPwd', pwdErr); return; }
    if (userPwd !== userPwd2) { setFieldError('userPwd2', '비밀번호가 일치하지 않습니다.'); return; }
    if (!userBirth) { setFieldError('userBirth', '생년월일을 입력해주세요.'); return; }
    if (userBirth >= new Date().toISOString().slice(0, 10)) { setFieldError('userBirth', '생년월일이 올바르지 않습니다.'); return; }
    const telErr = validatePhone(userTel); if (telErr) { setFieldError('userTel', telErr); return; }

    try {
      setSubmitting(true);
      await authApi.signup({ userNm: userNm.trim(), userNickname: userNickname.trim(), userEmail: userEmail.trim(), userPwd, userBirth, userTel: userTel.trim() });
      setDone(true);
    } catch (err) {
      setGlobalError(toKoreanMessage(err, '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <div className={styles.cardWrap}>
        <section className={styles.card}>
          {done ? (
            <>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <div className={styles.brandLine} aria-hidden="true" />
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>회원가입 완료</h2>
              </div>
              <p className={styles.desc}>이제 로그인할 수 있어요.</p>
              <Link to="/login" className={styles.primaryLink}>로그인으로 이동</Link>
            </>
          ) : (
            <>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <div className={styles.brandLine} aria-hidden="true" />
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>회원가입</h2>
              </div>

              <form className={styles.form} onSubmit={onSubmit} noValidate>
                {error ? <div ref={summaryRef} tabIndex={-1} className={styles.error} role="alert" aria-live="assertive">{error}</div> : null}

                {/* 이름 */}
                <div className={`${styles.row} ${fieldErrors.userNm ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userNm">이름</label>
                  <input id="su-userNm" ref={setFieldRef('userNm')} className={styles.input} name="userNm" value={form.userNm} onChange={onChange} disabled={submitting} placeholder="실명을 입력해주세요" autoComplete="name" aria-invalid={Boolean(fieldErrors.userNm)} required />
                </div>
                {fieldErrors.userNm ? <p className={styles.fieldError} role="alert">{fieldErrors.userNm}</p> : null}

                {/* 닉네임 */}
                <div className={`${styles.row} ${fieldErrors.userNickname ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userNickname">닉네임</label>
                  <div className={styles.inlineGroup}>
                    <input id="su-userNickname" ref={setFieldRef('userNickname')} className={styles.input} name="userNickname" value={form.userNickname} onChange={onChange} disabled={submitting} placeholder="2~20자" maxLength={20} aria-invalid={Boolean(fieldErrors.userNickname)} required />
                    <button type="button" onClick={checkNickname} disabled={submitting || nicknameStatus === 'checking'} className={`${styles.inlineBtn} ${nicknameChecked ? styles.inlineBtnSuccess : ''}`}>
                      {nicknameStatus === 'checking' ? '확인 중…' : nicknameChecked ? '사용 가능' : '중복확인'}
                    </button>
                  </div>
                </div>
                {fieldErrors.userNickname ? <p className={styles.fieldError} role="alert">{fieldErrors.userNickname}</p> : null}
                {nicknameStatus === 'ok' ? <p className={styles.successText} role="status">사용 가능한 닉네임입니다.</p> : null}

                {/* 이메일 */}
                <div className={`${styles.row} ${fieldErrors.userEmail ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userEmail">이메일</label>
                  <div className={styles.inlineGroup}>
                    <input id="su-userEmail" ref={setFieldRef('userEmail')} className={styles.input} type="email" name="userEmail" value={form.userEmail} onChange={onChange} disabled={submitting || emailVerified} placeholder="example@domain.com" autoComplete="email" aria-invalid={Boolean(fieldErrors.userEmail)} required />
                    <button type="button" onClick={sendEmailCode} disabled={submitting || emailCodeStatus === 'sending' || emailVerified || cooldown > 0} className={`${styles.inlineBtn} ${emailVerified ? styles.inlineBtnSuccess : ''}`}>
                      {emailVerified ? '인증완료' : emailCodeStatus === 'sending' ? '발송 중…' : cooldown > 0 ? `재발송(${cooldown}s)` : emailCodeSent ? '재발송' : '인증코드'}
                    </button>
                  </div>
                </div>
                {fieldErrors.userEmail ? <p className={styles.fieldError} role="alert">{fieldErrors.userEmail}</p> : null}

                {/* 인증코드 */}
                {emailCodeSent && !emailVerified ? (
                  <>
                    <div className={`${styles.row} ${fieldErrors.emailCode ? styles.rowError : ""}`.trim()}>
                      <label className={styles.tag} htmlFor="su-emailCode">인증코드</label>
                      <div className={styles.inlineGroup}>
                        <input id="su-emailCode" ref={setFieldRef('emailCode')} className={styles.input} value={emailCodeInput} onChange={(e) => { setEmailCodeInput(e.target.value); clearFieldError('emailCode'); }} placeholder="6자리 숫자" maxLength={6} disabled={submitting || emailCodeStatus === 'verifying'} aria-invalid={Boolean(fieldErrors.emailCode)} />
                        <button type="button" onClick={verifyEmailCode} disabled={submitting || emailCodeStatus === 'verifying'} className={`${styles.inlineBtn} ${emailCodeStatus === 'fail' ? styles.inlineBtnWarn : ''}`}>
                          {emailCodeStatus === 'verifying' ? '확인 중…' : '확인'}
                        </button>
                      </div>
                    </div>
                    {fieldErrors.emailCode ? <p className={styles.fieldError} role="alert">{fieldErrors.emailCode}</p> : null}
                  </>
                ) : null}

                {/* 비밀번호 */}
                <div className={`${styles.row} ${fieldErrors.userPwd ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userPwd">비밀번호</label>
                  <input id="su-userPwd" ref={setFieldRef('userPwd')} className={styles.input} type="password" name="userPwd" value={form.userPwd} onChange={onChange} disabled={submitting} placeholder="영문+숫자+특수문자 8자 이상" autoComplete="new-password" aria-invalid={Boolean(fieldErrors.userPwd)} required />
                </div>
                {fieldErrors.userPwd ? <p className={styles.fieldError} role="alert">{fieldErrors.userPwd}</p> : null}
                {form.userPwd ? (
                  <div className={styles.pwdRules} aria-live="polite">
                    {PWD_RULES.map(({ key, label }) => (
                      <span key={key} className={`${styles.pwdRule} ${pwdChecks[key] ? styles.pwdRuleOk : ''}`}>
                        <span aria-hidden="true">{pwdChecks[key] ? '✓' : '•'}</span>{label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* 비밀번호 확인 */}
                <div className={`${styles.row} ${fieldErrors.userPwd2 ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userPwd2">비밀번호 확인</label>
                  <input id="su-userPwd2" ref={setFieldRef('userPwd2')} className={styles.input} type="password" name="userPwd2" value={form.userPwd2} onChange={onChange} disabled={submitting} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.userPwd2)} required />
                </div>
                {fieldErrors.userPwd2 ? <p className={styles.fieldError} role="alert">{fieldErrors.userPwd2}</p> : null}
                {form.userPwd2 && form.userPwd === form.userPwd2 ? <p className={styles.successText} role="status">비밀번호가 일치합니다.</p> : null}

                {/* 생년월일 */}
                <div className={`${styles.row} ${fieldErrors.userBirth ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userBirth">생년월일</label>
                  <input id="su-userBirth" ref={setFieldRef('userBirth')} className={styles.input} type="date" name="userBirth" value={form.userBirth} onChange={onChange} disabled={submitting} max={new Date().toISOString().slice(0, 10)} aria-invalid={Boolean(fieldErrors.userBirth)} required />
                </div>
                {fieldErrors.userBirth ? <p className={styles.fieldError} role="alert">{fieldErrors.userBirth}</p> : null}

                {/* 전화번호 */}
                <div className={`${styles.row} ${fieldErrors.userTel ? styles.rowError : ""}`.trim()}>
                  <label className={styles.tag} htmlFor="su-userTel">전화번호</label>
                  <input id="su-userTel" ref={setFieldRef('userTel')} className={styles.input} name="userTel" value={form.userTel} onChange={onChange} disabled={submitting} placeholder="010-1234-5678" autoComplete="tel" maxLength={13} aria-invalid={Boolean(fieldErrors.userTel)} required />
                </div>
                {fieldErrors.userTel ? <p className={styles.fieldError} role="alert">{fieldErrors.userTel}</p> : null}

                <button className={styles.submit} type="submit" disabled={submitting}>
                  {submitting ? '처리 중…' : '회원가입'}
                </button>

                <div className={styles.bottomLinks}>
                  <span className={styles.hint}>이미 계정이 있나요?</span>
                  <Link className={styles.link} to="/login">로그인</Link>
                </div>
              </form>
            </>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}
