import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { authApi } from '../api/authApi';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import styles from './FindAccount.module.css';

const TAB = { EMAIL: 'email', PASSWORD: 'password' };

export default function FindAccount() {
  const [tab, setTab] = useState(TAB.EMAIL);

  const [emailForm, setEmailForm]   = useState({ userNm: '', userTel: '' });
  const [emailResult, setEmailResult] = useState('');
  const [emailError, setEmailError]   = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [pwForm, setPwForm]   = useState({ userEmail: '' });
  const [pwSent, setPwSent]   = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const switchTab = (next) => {
    setTab(next);
    setEmailResult(''); setEmailError('');
    setPwSent(false);   setPwError('');
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError(''); setEmailResult('');
    if (!emailForm.userNm.trim())  return setEmailError('이름을 입력해주세요.');
    if (!emailForm.userTel.trim()) return setEmailError('전화번호를 입력해주세요.');
    try {
      setEmailLoading(true);
      const maskedEmail = await authApi.findEmail(emailForm);
      setEmailResult(maskedEmail);
    } catch (err) {
      setEmailError(toKoreanMessage(err, '아이디를 찾을 수 없습니다.'));
    } finally { setEmailLoading(false); }
  };

  const onPwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!pwForm.userEmail.trim()) return setPwError('이메일을 입력해주세요.');
    try {
      setPwLoading(true);
      await authApi.requestPasswordReset({ userEmail: pwForm.userEmail.trim() });
      setPwSent(true);
    } catch (err) {
      setPwError(toKoreanMessage(err, '요청 처리 중 오류가 발생했습니다.'));
    } finally { setPwLoading(false); }
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
          </div>

          {/* 탭 */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === TAB.EMAIL ? styles.tabActive : ''}`}
              onClick={() => switchTab(TAB.EMAIL)} type="button"
            >
              아이디 찾기
            </button>
            <button
              className={`${styles.tab} ${tab === TAB.PASSWORD ? styles.tabActive : ''}`}
              onClick={() => switchTab(TAB.PASSWORD)} type="button"
            >
              비밀번호 찾기
            </button>
          </div>

          {/* 아이디 찾기 */}
          {tab === TAB.EMAIL && (
            <form className={styles.form} onSubmit={onEmailSubmit}>
              <p className={styles.desc}>가입 시 등록한 이름과 전화번호를 입력해주세요.</p>

              <div className={styles.row}>
                <span className={styles.tag}>이름</span>
                <input className={styles.input} type="text"
                  value={emailForm.userNm}
                  onChange={(e) => setEmailForm((p) => ({ ...p, userNm: e.target.value }))}
                  placeholder="홍길동" disabled={emailLoading} />
              </div>

              <div className={styles.row}>
                <span className={styles.tag}>전화번호</span>
                <input className={styles.input} type="tel"
                  value={emailForm.userTel}
                  onChange={(e) => setEmailForm((p) => ({ ...p, userTel: e.target.value }))}
                  placeholder="010-1234-5678" disabled={emailLoading} />
              </div>

              {emailError && <p className={styles.fieldError} role="alert">{emailError}</p>}
              {emailResult && <div className={styles.result}>가입된 이메일: <strong>{emailResult}</strong></div>}

              <button className={styles.submit} type="submit" disabled={emailLoading}>
                {emailLoading ? '조회 중…' : '아이디 찾기'}
              </button>
            </form>
          )}

          {/* 비밀번호 찾기 */}
          {tab === TAB.PASSWORD && (
            <>
              {pwSent ? (
                <div className={styles.sentBox}>
                  <div className={styles.sentIcon}>✉️</div>
                  <p className={styles.sentTitle}>이메일을 확인해주세요</p>
                  <p className={styles.sentDesc}>
                    입력하신 이메일 주소로 비밀번호 재설정 링크를 보냈습니다.<br />
                    <span className={styles.sentNote}>링크는 30분 후 만료됩니다.</span>
                  </p>
                  <button className={styles.subBtn} type="button"
                    onClick={() => { setPwSent(false); setPwForm({ userEmail: '' }); }}>
                    다시 요청하기
                  </button>
                </div>
              ) : (
                <form className={styles.form} onSubmit={onPwSubmit}>
                  <p className={styles.desc}>
                    가입 시 사용한 이메일을 입력하시면<br />
                    비밀번호 재설정 링크를 보내드립니다.
                  </p>

                  <div className={styles.row}>
                    <span className={styles.tag}>이메일</span>
                    <input className={styles.input} type="email"
                      value={pwForm.userEmail}
                      onChange={(e) => setPwForm({ userEmail: e.target.value })}
                      placeholder="example@domain.com"
                      disabled={pwLoading} autoComplete="email" />
                  </div>

                  {pwError && <p className={styles.fieldError} role="alert">{pwError}</p>}

                  <button className={styles.submit} type="submit" disabled={pwLoading}>
                    {pwLoading ? '전송 중…' : '재설정 링크 보내기'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* 하단 링크 */}
          <div className={styles.bottomLinks}>
            <Link className={styles.link} to="/login">로그인</Link>
            <span className={styles.sep}>·</span>
            <Link className={styles.link} to="/signup">회원가입</Link>
          </div>

        </section>
        </div>
      </main>
    </div>
  );
}
