import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { authApi } from '../api/authApi';
import Header from '../../../app/layouts/components/Header';
import Modal from '../../../shared/components/Modal/Modal';
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

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

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
    if (!agreeTerms || !agreePrivacy) { setGlobalError('이용약관과 개인정보 처리방침에 동의해주세요.'); return; }

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

                {/* 약관 동의 */}
                <div className={styles.agreeSection}>
                  <label className={styles.agreeRow}>
                    <input type="checkbox" checked={agreeTerms && agreePrivacy} onChange={(e) => { setAgreeTerms(e.target.checked); setAgreePrivacy(e.target.checked); }} />
                    <span className={styles.agreeAll}>전체 동의</span>
                  </label>
                  <div className={styles.agreeDivider} />
                  <label className={styles.agreeRow}>
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                    <span>[필수] 서비스 이용약관 동의</span>
                    <button type="button" className={styles.agreeViewBtn} onClick={() => setTermsModalOpen(true)}>보기</button>
                  </label>
                  <label className={styles.agreeRow}>
                    <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} />
                    <span>[필수] 개인정보 처리방침 동의</span>
                    <button type="button" className={styles.agreeViewBtn} onClick={() => setPrivacyModalOpen(true)}>보기</button>
                  </label>
                </div>

                <button className={styles.submit} type="submit" disabled={submitting || !agreeTerms || !agreePrivacy}>
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

      {/* 이용약관 모달 */}
      <Modal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} title="서비스 이용약관" size="lg">
        <div className={styles.termsContent}>
          <h3>UNI PLACE 서비스 이용약관</h3>
          <p className={styles.termsDate}>시행일: 2026년 1월 1일</p>

          <h4>제1조 (목적)</h4>
          <p>본 약관은 주식회사 유니플레이스(이하 "회사")가 운영하는 코리빙 주거 플랫폼 UNI PLACE(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

          <h4>제2조 (정의)</h4>
          <ul>
            <li>"서비스"란 회사가 제공하는 주거 공간 임대 중개, 계약 관리, 공용 시설 예약, 룸서비스 주문, 커뮤니티 등 관련 제반 서비스를 의미합니다.</li>
            <li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용 계약을 체결한 자를 말합니다.</li>
            <li>"입주자"란 회사를 통해 임대차 계약을 체결하고 실제 거주 중인 회원을 말합니다.</li>
          </ul>

          <h4>제3조 (회원 가입)</h4>
          <ul>
            <li>회원 가입은 이용자가 본 약관의 내용에 동의한 후, 회사가 정한 절차에 따라 가입 신청을 하고 회사가 이를 승낙함으로써 성립합니다.</li>
            <li>회원은 가입 시 실명 및 실제 정보를 기재하여야 하며, 허위 또는 타인의 정보를 기재한 경우 서비스 이용에 제한을 받을 수 있습니다.</li>
            <li>만 14세 미만의 아동은 회원 가입이 불가합니다.</li>
          </ul>

          <h4>제4조 (서비스의 제공 및 변경)</h4>
          <ul>
            <li>회사는 다음의 서비스를 제공합니다: 주거 공간 검색 및 정보 제공, 방 투어(사전 방문) 예약, 임대차 계약 체결 중개, 월세·관리비 결제, 공용 시설 예약, 룸서비스(생활용품) 주문, 커뮤니티 게시판, 민원 접수 및 고객 지원</li>
            <li>회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
          </ul>

          <h4>제5조 (회원의 의무)</h4>
          <ul>
            <li>회원은 관계 법령, 본 약관, 이용 안내 등 회사가 공지하는 사항을 준수하여야 합니다.</li>
            <li>회원은 타인의 개인정보를 도용하거나, 서비스를 부정한 목적으로 이용하여서는 안 됩니다.</li>
            <li>회원은 서비스 이용 시 다음 각 호의 행위를 하여서는 안 됩니다: 타인 명의 계약 또는 대리 계약, 임의 전대차(재임대), 공용 시설 독점 사용 또는 고의 파손, 타 입주자에게 피해를 주는 행위, 관리 규정 위반 행위</li>
          </ul>

          <h4>제6조 (계약 및 결제)</h4>
          <ul>
            <li>임대차 계약은 회원이 서비스를 통해 계약 신청을 하고, 임대인이 이를 승낙함으로써 성립합니다.</li>
            <li>월세 및 관리비는 계약서에 명시된 납부일까지 서비스 내 결제 수단을 통해 납부하여야 합니다.</li>
            <li>2회 이상 월세를 연체할 경우 서비스 이용이 제한되거나 계약이 해지될 수 있습니다.</li>
          </ul>

          <h4>제7조 (서비스 이용 제한 및 자격 상실)</h4>
          <p>회사는 다음 각 호에 해당하는 경우 사전 통보 후 서비스 이용을 제한하거나 회원 자격을 상실시킬 수 있습니다: 본 약관을 위반한 경우, 서비스 운영을 고의로 방해한 경우, 공공질서 및 미풍양속에 반하는 행위를 한 경우, 기타 회사가 합리적인 판단에 의해 필요하다고 인정하는 경우</p>

          <h4>제8조 (면책 조항)</h4>
          <ul>
            <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</li>
            <li>회사는 회원의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
            <li>회사는 제3자가 제공하는 결제 서비스(카카오페이, 토스 등)의 장애에 대해 책임을 지지 않습니다.</li>
          </ul>

          <h4>제9조 (분쟁 해결)</h4>
          <p>본 약관에 관한 분쟁은 대한민국 법률을 적용하며, 회사와 회원 간 발생한 분쟁에 대해서는 민사소송법상의 관할 법원에 소를 제기할 수 있습니다.</p>

          <h4>부칙</h4>
          <p>본 약관은 2026년 1월 1일부터 시행합니다.</p>
        </div>
      </Modal>

      {/* 개인정보 처리방침 모달 */}
      <Modal open={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} title="개인정보 처리방침" size="lg">
        <div className={styles.termsContent}>
          <h3>UNI PLACE 개인정보 처리방침</h3>
          <p className={styles.termsDate}>시행일: 2026년 1월 1일</p>

          <h4>제1조 (수집하는 개인정보 항목 및 수집 방법)</h4>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
          <ul>
            <li><strong>회원 가입 시 (필수)</strong>: 이름, 이메일 주소, 비밀번호, 휴대전화 번호, 생년월일</li>
            <li><strong>회원 가입 시 (선택)</strong>: 프로필 사진, 닉네임</li>
            <li><strong>소셜 로그인 시</strong>: 해당 소셜 서비스에서 제공하는 이메일, 닉네임, 프로필 사진 (카카오, 구글)</li>
            <li><strong>계약 체결 시</strong>: 은행 계좌 정보 (보증금 반환 목적)</li>
            <li><strong>서비스 이용 과정에서 자동 수집</strong>: 서비스 이용 기록, 접속 로그, 접속 IP, 쿠키, 결제 기록</li>
          </ul>

          <h4>제2조 (개인정보의 수집 및 이용 목적)</h4>
          <ul>
            <li>회원 식별 및 가입 의사 확인, 본인 인증</li>
            <li>임대차 계약 체결 및 이행, 계약 관리</li>
            <li>월세·관리비 결제 처리 및 청구서 발행</li>
            <li>공용 시설 예약 및 룸서비스 주문 처리</li>
            <li>민원 접수 및 고객 상담, 분쟁 조정을 위한 기록 보존</li>
            <li>서비스 개선 및 맞춤형 서비스 제공을 위한 통계 분석</li>
            <li>법령상 의무 이행</li>
          </ul>

          <h4>제3조 (개인정보의 보유 및 이용 기간)</h4>
          <p>회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의하여 보존할 필요가 있는 경우 아래와 같이 관계 법령에서 정한 기간 동안 보존합니다.</p>
          <ul>
            <li>계약 또는 청약 철회에 관한 기록: 5년 (전자상거래 등에서의 소비자 보호에 관한 법률)</li>
            <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (동법)</li>
            <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (동법)</li>
            <li>로그인 기록: 3개월 (통신비밀보호법)</li>
          </ul>

          <h4>제4조 (개인정보의 제3자 제공)</h4>
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            <li>결제 처리를 위한 PG사 제공 (카카오페이, 토스페이먼츠 등 — 결제 정보에 한함)</li>
          </ul>

          <h4>제5조 (개인정보 처리 위탁)</h4>
          <ul>
            <li>결제 처리: 카카오페이 주식회사, 주식회사 토스페이먼츠</li>
            <li>클라우드 서버 운영: Amazon Web Services, Inc.</li>
            <li>이메일 발송: Google LLC (Gmail SMTP)</li>
          </ul>
          <p>위탁 업체에 대해 개인정보 보호 관련 법규 준수를 계약으로 의무화하고 있습니다.</p>

          <h4>제6조 (이용자의 권리 및 행사 방법)</h4>
          <p>이용자(또는 법정대리인)는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>오류 등이 있을 경우 정정 요청</li>
            <li>삭제 요청 (단, 법령에서 수집 대상으로 명시한 정보는 삭제 불가)</li>
            <li>처리 정지 요청</li>
          </ul>
          <p>권리 행사는 서비스 내 마이페이지 또는 고객센터(1:1 문의)를 통해 가능합니다.</p>

          <h4>제7조 (개인정보의 파기 절차 및 방법)</h4>
          <p>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</p>

          <h4>제8조 (개인정보 보호책임자)</h4>
          <ul>
            <li>개인정보 보호책임자: UNI PLACE 운영팀</li>
            <li>연락처: 서비스 내 1:1 문의 또는 고객센터</li>
          </ul>

          <h4>부칙</h4>
          <p>본 방침은 2026년 1월 1일부터 시행합니다.</p>
        </div>
      </Modal>
    </div>
  );
}
