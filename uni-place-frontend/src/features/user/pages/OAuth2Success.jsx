import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Modal from '../../../shared/components/Modal/Modal';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import { authApi } from '../api/authApi';
import {
  validatePassword, validatePhone,
  validateName, validateNickname,
} from '../../../shared/utils/validators';
import styles from './OAuth2Success.module.css';

const STORAGE_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  device: 'device_id',
};
const OAUTH_RETURN_TO_KEY = 'oauth_return_to';

function parseHash() {
  const hash = window.location.hash?.startsWith('#')
    ? window.location.hash.slice(1)
    : '';
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('accessToken') || '',
    refreshToken: params.get('refreshToken') || '',
    deviceId: params.get('deviceId') || '',
    signupToken: params.get('signupToken') || '',
    provider: params.get('provider') || '',
    error: params.get('error') || '',
  };
}

function setTokens({ accessToken, refreshToken, deviceId }) {
  if (accessToken) localStorage.setItem(STORAGE_KEYS.access, accessToken);
  if (refreshToken) localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  if (deviceId) localStorage.setItem(STORAGE_KEYS.device, deviceId);
}

function consumeOAuthReturnTo() {
  const target = localStorage.getItem(OAUTH_RETURN_TO_KEY) || '';
  localStorage.removeItem(OAUTH_RETURN_TO_KEY);
  return target.startsWith('/') ? target : '/';
}

function getProviderMeta(provider) {
  const key = String(provider || '').toLowerCase();
  if (key === 'google')
    return { key, label: 'Google', chipClass: 'googleChip' };
  if (key === 'kakao') return { key, label: 'Kakao', chipClass: 'kakaoChip' };
  return { key, label: provider || 'Social', chipClass: 'defaultChip' };
}

export default function OAuth2Success() {
  const navigate = useNavigate();
  const payload = useMemo(() => parseHash(), []);
  const providerMeta = useMemo(
    () => getProviderMeta(payload.provider),
    [payload.provider]
  );

  const [form, setForm] = useState({
    userNm: '',
    userBirth: '',
    userTel: '',
    userPwd: '',
    userPwd2: '',
    userNickname: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [pwdChecks, setPwdChecks] = useState({ length: false, letter: false, number: false, special: false });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const setFieldError = (name, msg) =>
    setFieldErrors((p) => ({ ...p, [name]: msg }));
  const clearFieldError = (name) =>
    setFieldErrors((p) => {
      const n = { ...p };
      delete n[name];
      return n;
    });

  /* ── 오류 리다이렉트 ── */
  if (payload.error) {
    localStorage.removeItem(OAUTH_RETURN_TO_KEY);
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.container}>
          <div className={styles.cardWrap}>
            <section className={styles.card}>
              <div className={styles.brand}>
                <p className={styles.welcome}>WELCOME TO</p>
                <div className={styles.brandLine} aria-hidden="true" />
                <h1 className={styles.brandName}>UNI-PLACE</h1>
                <h2 className={styles.title}>소셜 로그인 실패</h2>
              </div>
              <p className={styles.desc}>오류 코드: {payload.error}</p>
              <button
                className={styles.submit}
                type="button"
                onClick={() => navigate('/login', { replace: true })}
              >
                로그인으로 돌아가기
              </button>
            </section>
          </div>
        </main>
      </div>
    );
  }

  /* ── 토큰 있으면 바로 이동 ── */
  if (payload.accessToken && payload.refreshToken) {
    setTokens(payload);
    const nextPath = consumeOAuthReturnTo();
    window.location.hash = '';
    window.location.replace(nextPath);
    return null;
  }

  const needsSignup = Boolean(payload.signupToken && payload.provider);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    clearFieldError(name);
    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(false);
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

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    clearFieldError('userNickname');
    if (!nickname) {
      setFieldError('userNickname', '닉네임을 입력해 주세요.');
      return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      setFieldError('userNickname', '닉네임은 2~20자로 입력해 주세요.');
      return;
    }
    setNicknameStatus('checking');
    try {
      const available = await authApi.checkNickname(nickname);
      if (available) {
        setNicknameStatus('ok');
        setNicknameChecked(true);
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

  const onCompleteSignup = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const nameErr = validateName(form.userNm);
    if (nameErr) { setFieldError('userNm', nameErr); return; }
    const nickErr = validateNickname(form.userNickname);
    if (nickErr) { setFieldError('userNickname', nickErr); return; }
    if (!nicknameChecked) {
      setFieldError('userNickname', '닉네임 중복 확인을 해주세요.');
      return;
    }
    if (!form.userBirth) {
      setFieldError('userBirth', '생년월일을 입력해 주세요.');
      return;
    }
    if (form.userBirth >= new Date().toISOString().slice(0, 10)) {
      setFieldError('userBirth', '생년월일이 올바르지 않습니다.');
      return;
    }
    const telErr = validatePhone(form.userTel);
    if (telErr) { setFieldError('userTel', telErr); return; }
    const pwdErr = validatePassword(form.userPwd);
    if (pwdErr) { setFieldError('userPwd', pwdErr); return; }
    if (form.userPwd !== form.userPwd2) {
      setFieldError('userPwd2', '비밀번호 확인 값이 일치하지 않습니다.');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setFieldError('_global', '이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const req = {
        signupToken: payload.signupToken,
        userNm: form.userNm.trim(),
        userNickname: form.userNickname.trim(),
        userBirth: form.userBirth,
        userTel: form.userTel.trim(),
        userPwd: form.userPwd,
      };
      const tokens =
        providerMeta.key === 'google'
          ? await authApi.googleComplete(req)
          : await authApi.kakaoComplete(req);

      setTokens(tokens || {});
      const nextPath = consumeOAuthReturnTo();
      window.location.hash = '';
      window.location.replace(nextPath);
    } catch (err) {
      setFieldError(
        '_global',
        toKoreanMessage(
          err,
          '소셜 회원가입 완료 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
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
        <div className={styles.cardWrap}>
          <section className={styles.card}>
            {needsSignup ? (
              <>
                <div className={styles.brand}>
                  <p className={styles.welcome}>WELCOME TO</p>
                  <div className={styles.brandLine} aria-hidden="true" />
                  <h1 className={styles.brandName}>UNI-PLACE</h1>
                  <h2 className={styles.title}>소셜 회원가입</h2>
                </div>

                {/* 프로바이더 칩 */}
                <div className={styles.providerRow}>
                  <span
                    className={`${styles.providerChip} ${styles[providerMeta.chipClass]}`}
                  >
                    {providerMeta.label}
                  </span>
                  <span className={styles.providerHint}>
                    {providerMeta.label} 계정으로 가입을 마무리합니다.
                  </span>
                </div>

                <form
                  className={styles.form}
                  onSubmit={onCompleteSignup}
                  noValidate
                >
                  {/* 전역 에러 */}
                  {fieldErrors._global && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors._global}
                    </p>
                  )}

                  {/* 이름 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userNm ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>이름</span>
                    <input
                      className={styles.input}
                      name="userNm"
                      value={form.userNm}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="실명을 입력해주세요"
                    />
                  </div>
                  {fieldErrors.userNm && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userNm}
                    </p>
                  )}

                  {/* 닉네임 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userNickname ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>닉네임</span>
                    <div className={styles.inlineGroup}>
                      <input
                        className={styles.inlineInput}
                        name="userNickname"
                        value={form.userNickname}
                        onChange={onChange}
                        disabled={submitting}
                        placeholder="2~20자"
                        maxLength={20}
                      />
                      <button
                        className={`${styles.inlineBtn} ${nicknameChecked ? styles.inlineBtnSuccess : ''}`}
                        type="button"
                        onClick={checkNickname}
                        disabled={submitting || nicknameStatus === 'checking'}
                      >
                        {nicknameStatus === 'checking'
                          ? '확인 중…'
                          : nicknameChecked
                            ? '사용 가능'
                            : '중복확인'}
                      </button>
                    </div>
                  </div>
                  {fieldErrors.userNickname && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userNickname}
                    </p>
                  )}
                  {nicknameStatus === 'ok' && (
                    <p className={styles.successText}>
                      사용 가능한 닉네임입니다.
                    </p>
                  )}

                  {/* 생년월일 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userBirth ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>생년월일</span>
                    <input
                      className={styles.input}
                      name="userBirth"
                      type="date"
                      value={form.userBirth}
                      onChange={onChange}
                      disabled={submitting}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  {fieldErrors.userBirth && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userBirth}
                    </p>
                  )}

                  {/* 전화번호 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userTel ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>전화번호</span>
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
                  {fieldErrors.userTel && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userTel}
                    </p>
                  )}

                  {/* 비밀번호 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userPwd ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>비밀번호</span>
                    <input
                      className={styles.input}
                      name="userPwd"
                      type="password"
                      value={form.userPwd}
                      onChange={onChange}
                      disabled={submitting}
                      placeholder="8자 이상"
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.userPwd && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userPwd}
                    </p>
                  )}
                  {form.userPwd && (
                    <div className={styles.pwdRules}>
                      {[
                        { key: 'length', label: '8자 이상' },
                        { key: 'letter', label: '영문 포함' },
                        { key: 'number', label: '숫자 포함' },
                        { key: 'special', label: '특수문자 포함' },
                      ].map(({ key, label }) => (
                        <span key={key} className={`${styles.pwdRule} ${pwdChecks[key] ? styles.pwdRuleOk : ''}`}>
                          {pwdChecks[key] ? '✓' : '•'} {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 비밀번호 확인 */}
                  <div
                    className={`${styles.row} ${fieldErrors.userPwd2 ? styles.rowError : ''}`}
                  >
                    <span className={styles.tag}>비밀번호 확인</span>
                    <input
                      className={styles.input}
                      name="userPwd2"
                      type="password"
                      value={form.userPwd2}
                      onChange={onChange}
                      disabled={submitting}
                      autoComplete="new-password"
                    />
                  </div>
                  {fieldErrors.userPwd2 && (
                    <p className={styles.fieldError} role="alert">
                      {fieldErrors.userPwd2}
                    </p>
                  )}
                  {form.userPwd2 && form.userPwd === form.userPwd2 && (
                    <p className={styles.successText}>비밀번호가 일치합니다.</p>
                  )}

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

                  <button
                    className={styles.submit}
                    type="submit"
                    disabled={submitting || !agreeTerms || !agreePrivacy}
                  >
                    {submitting ? '처리 중…' : '가입 완료'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className={styles.brand}>
                  <p className={styles.welcome}>WELCOME TO</p>
                  <div className={styles.brandLine} aria-hidden="true" />
                  <h1 className={styles.brandName}>UNI-PLACE</h1>
                  <h2 className={styles.title}>소셜 로그인 처리 중</h2>
                </div>
                <p className={styles.desc}>
                  토큰 정보가 없습니다. 다시 로그인해 주세요.
                </p>
                <button
                  className={styles.submit}
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  로그인으로 이동
                </button>
              </>
            )}
          </section>
        </div>
      </main>

      <Modal open={termsModalOpen} onClose={() => setTermsModalOpen(false)} title="서비스 이용약관" size="lg">
        <div className={styles.termsContent}>
          <h3>UNI PLACE 서비스 이용약관</h3>
          <p className={styles.termsDate}>시행일: 2026년 1월 1일</p>
          <h4>제1조 (목적)</h4>
          <p>본 약관은 주식회사 유니플레이스(이하 "회사")가 운영하는 코리빙 주거 플랫폼 UNI PLACE(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
          <h4>제2조 (정의)</h4>
          <ul>
            <li>"서비스"란 주거 공간 임대 중개, 계약 관리, 공용 시설 예약, 룸서비스 주문 등 관련 제반 서비스를 의미합니다.</li>
            <li>"회원"이란 본 약관에 동의하고 서비스 이용 계약을 체결한 자를 말합니다.</li>
          </ul>
          <h4>제3조 (회원 가입)</h4>
          <ul>
            <li>회원은 가입 시 실명 및 실제 정보를 기재하여야 하며, 허위 정보 기재 시 서비스 이용에 제한을 받을 수 있습니다.</li>
            <li>만 14세 미만의 아동은 회원 가입이 불가합니다.</li>
          </ul>
          <h4>제4조 (회원의 의무)</h4>
          <ul>
            <li>타인 명의 계약 또는 대리 계약, 임의 전대차 금지</li>
            <li>공용 시설 독점 사용 또는 고의 파손 금지</li>
            <li>타 입주자에게 피해를 주는 행위 금지</li>
          </ul>
          <h4>제5조 (면책 조항)</h4>
          <p>천재지변, 불가항력적 사유로 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</p>
        </div>
      </Modal>

      <Modal open={privacyModalOpen} onClose={() => setPrivacyModalOpen(false)} title="개인정보 처리방침" size="lg">
        <div className={styles.termsContent}>
          <h3>UNI PLACE 개인정보 처리방침</h3>
          <p className={styles.termsDate}>시행일: 2026년 1월 1일</p>
          <h4>제1조 (수집 항목)</h4>
          <ul>
            <li><strong>소셜 로그인 시</strong>: 해당 소셜 서비스에서 제공하는 이메일, 닉네임, 프로필 사진</li>
            <li><strong>추가 입력</strong>: 이름, 생년월일, 연락처, 비밀번호</li>
          </ul>
          <h4>제2조 (수집·이용 목적)</h4>
          <p>회원 식별 및 계정 관리, 계약 체결 및 이행, 결제 처리, 고객 지원</p>
          <h4>제3조 (보유 기간)</h4>
          <ul>
            <li>회원 정보: 탈퇴 후 즉시 삭제 (법적 보관 의무 항목 제외)</li>
            <li>계약 관련 정보: 계약 종료 후 5년</li>
          </ul>
          <h4>제4조 (동의 거부 권리)</h4>
          <p>필수 항목에 대한 동의를 거부하실 경우 회원 가입이 불가합니다.</p>
        </div>
      </Modal>
    </div>
  );
}
