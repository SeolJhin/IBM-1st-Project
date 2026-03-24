// features/user/pages/MemberInfo.jsx
// 마이페이지 메인 — VIVADE-style Edition
// Home / Support 디자인 언어 통일: 직사각형, 크림·골드 팔레트, 스크롤 애니메이션
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import styles from './MemberInfo.module.css';
import FaceLoginModal from '../components/FaceLoginModal';

import { authApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import {
  validatePassword,
  validateEmail,
  validatePhone,
  validateNickname,
} from '../../../shared/utils/validators';

import MyContractView from '../../contract/pages/MyContractView';
import MyMonthlyCharges from '../../billing/pages/MyMonthlyCharges';
import MyPosts from '../../community/pages/MyPosts';
import { useQnas } from '../../support/hooks/useQnas';
import { useComplains } from '../../support/hooks/useComplains';
import ProductList from '../../commerce/pages/ProductList';
import Cart from '../../commerce/pages/Cart';
import Checkout from '../../commerce/pages/Checkout';
import OrderList from '../../commerce/pages/OrderList';
import OrderDetail from '../../commerce/pages/OrderDetail';
import MyPaymentHistory from '../../payment/pages/MyPaymentHistory';

import Modal from '../../../shared/components/Modal/Modal';
import ErrorActionNotice from '../../../shared/components/ErrorActionNotice/ErrorActionNotice';
import SpaceReservationCreate from '../../reservation/pages/SpaceReservationCreate';
import SpaceReservationList from '../../reservation/pages/SpaceReservationList';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

// ── 탭 키 상수 ────────────────────────────────────────────────
const TAB = {
  ME: 'me',
  MYROOM: 'myroom',
  POSTS: 'posts',
  SPACE: 'space',
  TOUR: 'tour',
  ROOMSERVICE: 'roomservice',
  PAYMENT: 'payment',
};

const SIDE_ITEMS = [
  { key: TAB.ME, label: '내 정보', dot: '#b8945a' },
  { key: TAB.MYROOM, label: '내 계약', dot: '#5a7ab8' },
  { key: TAB.POSTS, label: '작성 목록', dot: '#3a7a50' },
  { key: TAB.SPACE, label: '공용 시설', dot: '#7a44b0' },
  { key: TAB.TOUR, label: '사전 방문', dot: '#a85030' },
  { key: TAB.ROOMSERVICE, label: '룸서비스', dot: '#5a8a8a' },
  { key: TAB.PAYMENT, label: '결제 내역', dot: '#888888' },
];

const SOCIAL_PROVIDER_ORDER = ['kakao', 'google'];
const SOCIAL_PROVIDER_LABEL = { kakao: '카카오', google: '구글' };

// ── useFadeIn 훅 (Home.jsx와 동일) ────────────────────────────
function useFadeIn(threshold = 0.08, direction = 'up') {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  const animClass =
    {
      up: styles.fadeInUp,
      left: styles.fadeInLeft,
      right: styles.fadeInRight,
    }[direction] ?? styles.fadeInUp;
  return [ref, visible, animClass];
}

// ── 내 정보 탭 ────────────────────────────────────────────────
function MeTab({ user }) {
  const navigate = useNavigate();
  const { refresh, logout } = useAuth();
  const [meLoading, setMeLoading] = useState(true);
  const [origin, setOrigin] = useState(null);
  const [form, setForm] = useState({
    userNm: '',
    userEmail: '',
    userTel: '',
    userId: '',
    userNickname: '',
  });
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    letter: false,
    number: false,
    special: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('');
  const [faceRegModal, setFaceRegModal] = useState(false);
  const [faceMenu, setFaceMenu] = useState(false);
  const [faceDeleting, setFaceDeleting] = useState(false);
  const [faceCount, setFaceCount] = useState(null);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [originalNickname, setOriginalNickname] = useState('');
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState({
    kakao: false,
    google: false,
  });

  const [ref, visible, animClass] = useFadeIn(0.05, 'up');

  const loadMe = useCallback(async () => {
    setError('');
    setMsg('');
    setMeLoading(true);
    setSocialLoading(true);
    try {
      const [me, socialAccounts] = await Promise.all([
        authApi.me(),
        authApi.meSocialAccounts().catch(() => []),
      ]);
      setOrigin(me ?? null);
      setForm({
        userNm: me?.userNm ?? '',
        userEmail: me?.userEmail ?? '',
        userTel: me?.userTel ?? '',
        userId: me?.userId ?? '',
        userNickname: me?.userNickname ?? '',
      });
      setOriginalNickname(me?.userNickname ?? '');
      setNicknameChecked(true);
      const linkedSet = new Set(
        (socialAccounts || [])
          .map((i) => String(i?.provider || '').toLowerCase())
          .filter(Boolean)
      );
      const nextLinks = {
        kakao: linkedSet.has('kakao'),
        google: linkedSet.has('google'),
      };
      setSocialLinks(nextLinks);

      const url = new URL(window.location.href);
      const lp = String(url.searchParams.get('linked') || '').toLowerCase();
      const le = String(url.searchParams.get('linkError') || '').toLowerCase();
      if (lp) {
        const lbl = SOCIAL_PROVIDER_LABEL[lp] || lp;
        if (nextLinks[lp]) setMsg(`${lbl} 연동이 완료되었습니다.`);
        else
          setError(
            `${lbl} 연동을 확인하지 못했습니다. 동일 이메일 계정인지 확인 후 다시 시도해주세요.`
          );
        url.searchParams.delete('linked');
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.search}${url.hash}`
        );
      }
      if (le) {
        setError(
          '소셜 계정 연동에 실패했습니다. 현재 비밀번호를 다시 확인하고, 이미 다른 계정에 연동된 소셜인지 확인해주세요.'
        );
        url.searchParams.delete('linkError');
        window.history.replaceState(
          {},
          '',
          `${url.pathname}${url.search}${url.hash}`
        );
      }
    } catch (e) {
      setError(e?.message || '내 정보 조회에 실패했습니다.');
    } finally {
      setMeLoading(false);
      setSocialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadMe();
  }, [user, loadMe]);

  // 드롭다운 바깥 클릭 닫기
  useEffect(() => {
    if (!faceMenu) return;
    const close = (e) => {
      if (!e.target.closest('[data-face-menu]')) setFaceMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [faceMenu]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === 'userNickname') {
      setNicknameStatus('');
      setNicknameChecked(value.trim() === originalNickname.trim());
    }
  };

  const checkNickname = async () => {
    const nickname = form.userNickname.trim();
    if (!nickname) return setError('닉네임을 입력해주세요.');
    if (nickname.length < 2 || nickname.length > 20)
      return setError('닉네임은 2~20자로 입력해주세요.');
    if (nickname === originalNickname.trim()) {
      setNicknameStatus('ok');
      setNicknameChecked(true);
      return;
    }
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

  const buildPayload = useCallback(() => {
    if (!origin) return null;
    const payload = {};
    const nNm = form.userNm?.trim() ?? '';
    const nEmail = form.userEmail?.trim() ?? '';
    const nTel = form.userTel?.trim() ?? '';
    const nNick = form.userNickname?.trim() ?? '';
    if (nNm && nNm !== (origin.userNm ?? '')) payload.userNm = nNm;
    if (nEmail && nEmail !== (origin.userEmail ?? ''))
      payload.userEmail = nEmail;
    if (nTel && nTel !== (origin.userTel ?? '')) payload.userTel = nTel;
    if (nNick && nNick !== (origin.userNickname ?? ''))
      payload.userNickname = nNick;
    if (newPwd?.trim()) {
      payload.userPwd = newPwd.trim();
      payload.currentUserPwd = currentPwd.trim();
    }
    return payload;
  }, [origin, form, newPwd, currentPwd]);

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!origin) return;
    if (newPwd.trim()) {
      const err = validatePassword(newPwd.trim());
      if (err) return setError(err);
    }
    if (form.userTel.trim()) {
      const err = validatePhone(form.userTel.trim());
      if (err) return setError(err);
    }
    if (form.userEmail.trim()) {
      const err = validateEmail(form.userEmail.trim());
      if (err) return setError(err);
    }
    const nNick = form.userNickname?.trim() ?? '';
    if (nNick !== (origin.userNickname ?? '').trim()) {
      const err = validateNickname(nNick);
      if (err) return setError(err);
      if (!nicknameChecked) return setError('닉네임 중복 확인을 해주세요.');
    }
    const payload = buildPayload();
    if (!payload || Object.keys(payload).length === 0) {
      setMsg('변경된 내용이 없어 취소 처리되었습니다.');
      return;
    }
    if (!currentPwd.trim()) {
      setError('수정을 위해 현재 비밀번호를 입력해주세요.');
      return;
    }
    try {
      setSubmitting(true);
      const pwdChanged = Boolean(payload.userPwd);
      await authApi.updateMe(payload);
      if (pwdChanged) {
        await authApi.logoutAll();
        await logout();
        navigate('/login', {
          replace: true,
          state: { message: '비밀번호가 변경되어 다시 로그인해주세요.' },
        });
        return;
      }
      await refresh?.();
      await loadMe();
      setCurrentPwd('');
      setNewPwd('');
      setMsg('수정이 완료되었습니다.');
    } catch (err) {
      setError(err?.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const onWithdraw = async () => {
    setError('');
    setMsg('');
    if (!window.confirm('정말 탈퇴하시겠어요?')) return;
    try {
      setSubmitting(true);
      try {
        await authApi.logoutAll();
      } catch {}
      await authApi.deleteMe();
      await logout();
      navigate('/', { replace: true });
    } catch (e) {
      setError(e?.message || '탈퇴에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const startSocialLink = async (provider) => {
    const p = String(provider || '').toLowerCase();
    if (!SOCIAL_PROVIDER_ORDER.includes(p)) return;
    if (socialLinks[p]) {
      setMsg(`${SOCIAL_PROVIDER_LABEL[p]} 연동이 이미 완료되어 있습니다.`);
      return;
    }
    if (!currentPwd.trim()) {
      setError('소셜 연동을 위해 현재 비밀번호를 입력해주세요.');
      return;
    }
    setError('');
    setMsg('');
    try {
      setLinkSubmitting(true);
      const result = await authApi.startSocialLink({
        provider: p,
        currentUserPwd: currentPwd.trim(),
        returnTo: `/me?tab=me&linked=${p}`,
      });
      if (!result?.authorizationUrl) {
        setError('소셜 연동 시작 URL을 가져오지 못했습니다.');
        return;
      }
      window.location.href = result.authorizationUrl;
    } catch (e) {
      setError(
        e?.koreanMessage || e?.message || '소셜 연동 시작에 실패했습니다.'
      );
    } finally {
      setLinkSubmitting(false);
    }
  };

  const unlinkSocialAccount = async (provider) => {
    const p = String(provider || '').toLowerCase();
    if (!SOCIAL_PROVIDER_ORDER.includes(p)) return;
    if (!socialLinks[p]) {
      setError(`${SOCIAL_PROVIDER_LABEL[p]}은(는) 아직 연동되지 않았습니다.`);
      return;
    }
    if (!currentPwd.trim()) {
      setError('소셜 연동 해제를 위해 현재 비밀번호를 입력해주세요.');
      return;
    }
    if (!window.confirm(`${SOCIAL_PROVIDER_LABEL[p]} 연동을 해제하시겠습니까?`))
      return;
    setError('');
    setMsg('');
    try {
      setLinkSubmitting(true);
      await authApi.unlinkSocialAccount({
        provider: p,
        currentUserPwd: currentPwd.trim(),
      });
      await loadMe();
      setMsg(`${SOCIAL_PROVIDER_LABEL[p]} 연동이 해제되었습니다.`);
    } catch (e) {
      setError(
        e?.koreanMessage || e?.message || '소셜 연동 해제에 실패했습니다.'
      );
    } finally {
      setLinkSubmitting(false);
    }
  };

  return (
    <div ref={ref} className={visible ? animClass : styles.fadeHidden}>
      {meLoading && <div className={styles.loading}>불러오는 중</div>}
      {!meLoading && (
        <>
          {/* 헤더 */}
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionEyebrow}>My Account</span>
              <h2 className={styles.sectionTitle}>본인 정보</h2>
            </div>
            <div className={styles.actionsRight} style={{ marginBottom: 0 }}>
              <div className={styles.faceMenuWrap} data-face-menu="true">
                <button
                  type="button"
                  className={`${styles.faceRegBtn} ${faceMenu ? styles.faceRegBtnOn : ''}`}
                  onClick={async () => {
                    const next = !faceMenu;
                    setFaceMenu(next);
                    if (next && faceCount === null) {
                      try {
                        const token =
                          localStorage.getItem('access_token') ||
                          localStorage.getItem('accessToken') ||
                          '';
                        const res = await fetch('/api/auth/face/count', {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await res.json();
                        setFaceCount(data?.data ?? 0);
                      } catch {
                        setFaceCount(0);
                      }
                    }
                  }}
                  disabled={submitting || meLoading}
                >
                  얼굴 로그인 ▾
                </button>
                {faceMenu && (
                  <div
                    className={styles.faceDropdown}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className={styles.faceDropHeader}>
                      등록된 얼굴{' '}
                      <strong>
                        {faceCount === null ? '조회 중…' : `${faceCount} / 5`}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className={styles.faceDropItem}
                      disabled={faceCount === null || faceCount >= 5}
                      onClick={() => {
                        setFaceMenu(false);
                        setFaceRegModal(true);
                      }}
                    >
                      얼굴 등록
                      <span className={styles.faceDropSub}>
                        {faceCount >= 5
                          ? '최대 등록 수 도달 (삭제 후 재등록)'
                          : '화장·안경 등 다양한 상태로 등록'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.faceDropItem} ${styles.faceDropDel}`}
                      disabled={faceDeleting || faceCount === 0}
                      onClick={async () => {
                        setFaceMenu(false);
                        if (
                          !window.confirm('등록된 얼굴 정보를 모두 삭제할까요?')
                        )
                          return;
                        try {
                          setFaceDeleting(true);
                          const token =
                            localStorage.getItem('access_token') ||
                            localStorage.getItem('accessToken') ||
                            '';
                          const res = await fetch('/api/auth/face', {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error();
                          setFaceCount(0);
                          setMsg('얼굴 정보가 삭제되었습니다.');
                        } catch {
                          setError('얼굴 정보 삭제에 실패했습니다.');
                        } finally {
                          setFaceDeleting(false);
                        }
                      }}
                    >
                      {faceDeleting ? '삭제 중…' : '얼굴 삭제'}
                      <span className={styles.faceDropSub}>
                        {faceCount === 0
                          ? '등록된 얼굴 없음'
                          : '등록 데이터 전체 제거'}
                      </span>
                    </button>
                  </div>
                )}
                {faceRegModal && (
                  <FaceLoginModal
                    mode="register"
                    email={user?.userEmail || user?.email || ''}
                    noOverlay
                    onSuccess={() => {
                      setFaceRegModal(false);
                      setFaceCount((cnt) => (cnt ?? 0) + 1);
                      setMsg(
                        '얼굴 등록이 완료되었습니다. 다음 로그인부터 얼굴 인식을 사용할 수 있습니다.'
                      );
                    }}
                    onClose={() => setFaceRegModal(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <form onSubmit={onSubmitUpdate}>
            {/* 정보 패널 */}
            <div className={styles.infoPanel}>
              <InfoRow label="이름">
                <input
                  className={styles.infoInput}
                  name="userNm"
                  value={form.userNm}
                  readOnly
                  disabled
                />
              </InfoRow>

              <InfoRow label="닉네임">
                <input
                  className={styles.infoInput}
                  name="userNickname"
                  value={form.userNickname}
                  onChange={onChange}
                  disabled={submitting}
                  placeholder="2~20자"
                  maxLength={20}
                />
                <button
                  type="button"
                  className={`${styles.btn} ${nicknameChecked ? styles.btnChecked : styles.btnPrimary}`}
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                  onClick={checkNickname}
                  disabled={submitting || nicknameStatus === 'checking'}
                >
                  {nicknameStatus === 'checking'
                    ? '확인 중'
                    : nicknameChecked
                      ? '✓ 확인됨'
                      : '중복확인'}
                </button>
              </InfoRow>
              {nicknameStatus === 'dup' && (
                <p className={`${styles.fieldHelper} ${styles.fieldErr}`}>
                  이미 사용 중인 닉네임입니다.
                </p>
              )}
              {nicknameStatus === 'ok' && !nicknameChecked && (
                <p className={`${styles.fieldHelper} ${styles.fieldOk}`}>
                  사용 가능한 닉네임입니다.
                </p>
              )}

              <InfoRow label="이메일">
                <input
                  className={styles.infoInput}
                  name="userEmail"
                  value={form.userEmail}
                  onChange={onChange}
                  disabled={submitting}
                />
              </InfoRow>

              <InfoRow label="전화번호">
                <input
                  className={styles.infoInput}
                  name="userTel"
                  value={form.userTel}
                  onChange={onChange}
                  disabled={submitting}
                />
              </InfoRow>

              <InfoRow label="아이디">
                <input
                  className={styles.infoInput}
                  name="userId"
                  value={form.userId}
                  readOnly
                  disabled
                />
              </InfoRow>

              <InfoRow label="현재 비밀번호">
                <input
                  className={styles.infoInput}
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="수정 시 현재 비밀번호 필요"
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </InfoRow>

              <InfoRow label="새 비밀번호">
                <input
                  className={styles.infoInput}
                  type="password"
                  value={newPwd}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewPwd(v);
                    setPwdChecks({
                      length: v.length >= 8,
                      letter: /[a-zA-Z]/.test(v),
                      number: /[0-9]/.test(v),
                      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(v),
                    });
                  }}
                  placeholder="영문 + 숫자 + 특수기호 8자 이상 (선택)"
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </InfoRow>
              {newPwd && (
                <div className={styles.pwdChecks}>
                  {[
                    { key: 'length', label: '8자 이상' },
                    { key: 'letter', label: '영문자' },
                    { key: 'number', label: '숫자' },
                    { key: 'special', label: '특수기호' },
                  ].map(({ key, label }) => (
                    <span
                      key={key}
                      className={`${styles.pwdCheck} ${pwdChecks[key] ? styles.pwdCheckOn : ''}`}
                    >
                      {pwdChecks[key] ? '✓' : '○'} {label}
                    </span>
                  ))}
                </div>
              )}

              <InfoRow label="소셜 연동">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SOCIAL_PROVIDER_ORDER.map((provider) => {
                    const linked = Boolean(socialLinks[provider]);
                    return (
                      <button
                        key={provider}
                        type="button"
                        className={`${styles.socialBadge} ${linked ? styles.socialLinked : styles.socialUnlinked}`}
                        onClick={() =>
                          linked
                            ? unlinkSocialAccount(provider)
                            : startSocialLink(provider)
                        }
                        disabled={
                          submitting ||
                          linkSubmitting ||
                          meLoading ||
                          socialLoading
                        }
                      >
                        {linked
                          ? `✓ ${SOCIAL_PROVIDER_LABEL[provider]} 연동됨`
                          : `${SOCIAL_PROVIDER_LABEL[provider]} 계정 연동`}
                      </button>
                    );
                  })}
                </div>
              </InfoRow>
            </div>

            {error && (
              <div
                className={`${styles.msgBox} ${styles.msgError}`}
                style={{ marginTop: 12 }}
              >
                {error}
              </div>
            )}
            {msg && (
              <div
                className={`${styles.msgBox} ${styles.msgSuccess}`}
                style={{ marginTop: 12 }}
              >
                {msg}
              </div>
            )}

            <div className={styles.actionsBar}>
              <p className={styles.actionsHint}>
                변경 사항은 현재 비밀번호 입력 후 저장됩니다.
              </p>
              <div className={styles.actionsRight}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={onWithdraw}
                  disabled={submitting || meLoading}
                >
                  회원 탈퇴
                </button>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={submitting || meLoading}
                >
                  {submitting ? '저장 중…' : '수정 저장'}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

// ── QnA 인라인 ────────────────────────────────────────────────
function QnaInline() {
  const { qnas, pagination, loading, error, goToPage, refetch } = useQnas();
  const navigate = useNavigate();
  const STATUS_MAP = { waiting: '답변대기', complete: '답변완료' };
  if (loading) return <div className={styles.loading}>불러오는 중</div>;
  if (error)
    return (
      <ErrorActionNotice
        error={error}
        fallback="문의 목록을 불러오지 못했습니다."
        onRetry={refetch}
      />
    );
  return (
    <div>
      <table className={styles.listTable}>
        <thead>
          <tr>
            <th style={{ width: 56 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 100 }}>상태</th>
            <th style={{ width: 96 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {qnas.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className={styles.emptyState}>작성된 문의가 없습니다.</div>
              </td>
            </tr>
          ) : (
            qnas.map((q) => (
              <tr
                key={q.qnaId}
                data-clickable="true"
                onClick={() => navigate(`/support/qna/${q.qnaId}`)}
              >
                <td style={{ color: '#9a9080', fontSize: 12 }}>{q.qnaId}</td>
                <td
                  style={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: 0,
                  }}
                >
                  {q.qnaTitle}
                </td>
                <td>
                  <span
                    className={`${styles.badge} ${q.qnaSt === 'complete' ? styles.badgeGold : styles.badgeGray}`}
                  >
                    {STATUS_MAP[q.qnaSt] ?? q.qnaSt}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#9a9080' }}>
                  {q.createdAt ? q.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.isLast}
            onClick={() => goToPage(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// ── 민원 인라인 ───────────────────────────────────────────────
function ComplainInline() {
  const { complains, pagination, loading, error, goToPage, refetch } =
    useComplains();
  const navigate = useNavigate();
  const STATUS_MAP = {
    received: '접수됨',
    in_progress: '처리중',
    resolved: '처리완료',
    closed: '완료',
    pending: '대기중',
  };
  if (loading) return <div className={styles.loading}>불러오는 중</div>;
  if (error)
    return (
      <ErrorActionNotice
        error={error}
        fallback="민원 목록을 불러오지 못했습니다."
        onRetry={refetch}
      />
    );
  return (
    <div>
      <table className={styles.listTable}>
        <thead>
          <tr>
            <th style={{ width: 56 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 100 }}>상태</th>
            <th style={{ width: 96 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {complains.length === 0 ? (
            <tr>
              <td colSpan={4}>
                <div className={styles.emptyState}>접수된 민원이 없습니다.</div>
              </td>
            </tr>
          ) : (
            complains.map((item) => (
              <tr
                key={item.compId}
                data-clickable="true"
                onClick={() => navigate(`/support/complain/${item.compId}`)}
              >
                <td style={{ color: '#9a9080', fontSize: 12 }}>
                  {item.compId}
                </td>
                <td
                  style={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    maxWidth: 0,
                  }}
                >
                  {item.compTitle}
                </td>
                <td>
                  <span
                    className={`${styles.badge} ${item.compSt === 'resolved' ? styles.badgeGold : styles.badgeGray}`}
                  >
                    {STATUS_MAP[item.compSt] ?? item.compSt}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#9a9080' }}>
                  {item.createdAt ? item.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.isLast}
            onClick={() => goToPage(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// ── 고객센터 탭 ───────────────────────────────────────────────
function SupportPostsTab() {
  const [sub, setSub] = useState('qna');
  return (
    <div>
      <div className={styles.subTabRow}>
        <button
          type="button"
          className={`${styles.subTab} ${sub === 'qna' ? styles.subTabActive : ''}`}
          onClick={() => setSub('qna')}
        >
          1:1 문의
        </button>
        <button
          type="button"
          className={`${styles.subTab} ${sub === 'complain' ? styles.subTabActive : ''}`}
          onClick={() => setSub('complain')}
        >
          민원
        </button>
      </div>
      {sub === 'qna' && <QnaInline />}
      {sub === 'complain' && <ComplainInline />}
    </div>
  );
}

// ── 룸서비스 탭 ───────────────────────────────────────────────
function RoomServiceTab() {
  const [view, setView] = useState('product');
  const [navState, setNavState] = useState({});
  const [toastMsg, setToastMsg] = useState('');
  const handleNav = (path, state = {}) => {
    setNavState(state);
    if (
      path === '/commerce/room-service' ||
      path.startsWith('/commerce/room-service')
    )
      setView('product');
    else if (path === '/commerce/cart') setView('cart');
    else if (path === '/commerce/checkout') setView('checkout');
    else if (path === '/commerce/orders') {
      if (state?.toastMsg) setToastMsg(state.toastMsg);
      setView('orders');
    } else if (path.startsWith('/commerce/orders/')) {
      setNavState((prev) => ({
        ...prev,
        orderId: Number(path.split('/').pop()),
      }));
      setView('orderDetail');
    }
  };
  return (
    <div>
      {view === 'product' && (
        <ProductList
          inlineMode
          onNav={handleNav}
          initialBuildingId={navState.selectedBuildingId}
        />
      )}
      {view === 'cart' && (
        <Cart
          inlineMode
          onNav={handleNav}
          buildingId={navState.selectedBuildingId}
          buildingNm={navState.selectedBuildingNm}
        />
      )}
      {view === 'checkout' && (
        <Checkout
          inlineMode
          onNav={handleNav}
          buildingId={navState.selectedBuildingId}
          buildingNm={navState.selectedBuildingNm}
        />
      )}
      {view === 'orders' && (
        <OrderList inlineMode onNav={handleNav} toastMsg={toastMsg} />
      )}
      {view === 'orderDetail' && (
        <OrderDetail inlineMode onNav={handleNav} orderId={navState.orderId} />
      )}
    </div>
  );
}

// ── 공용 시설 탭 ──────────────────────────────────────────────
function SpaceTab({
  spaceSubTab,
  setSpaceSubTab,
  setSearchParams,
  aiSpaceInit,
  clearAiSpaceInit,
}) {
  return (
    <div>
      <div className={styles.sectionHead} style={{ marginBottom: 20 }}>
        <div className={styles.sectionTitleGroup}>
          <span className={styles.sectionEyebrow}>Facilities</span>
          <h2 className={styles.sectionTitle}>공용 시설 예약</h2>
        </div>
      </div>
      <div className={styles.subTabRow}>
        <button
          type="button"
          className={`${styles.subTab} ${spaceSubTab === 'create' ? styles.subTabActive : ''}`}
          onClick={() => {
            setSpaceSubTab('create');
            setSearchParams({ tab: TAB.SPACE, sub: 'create' });
          }}
        >
          예약 생성
        </button>
        <button
          type="button"
          className={`${styles.subTab} ${spaceSubTab === 'list' ? styles.subTabActive : ''}`}
          onClick={() => {
            setSpaceSubTab('list');
            setSearchParams({ tab: TAB.SPACE, sub: 'list' });
            if (clearAiSpaceInit) clearAiSpaceInit();
          }}
        >
          내 예약 조회
        </button>
      </div>
      {spaceSubTab === 'create' && (
        <SpaceReservationCreate
          inlineMode
          initSpaceId={aiSpaceInit?.spaceId ?? null}
          initBuildingId={aiSpaceInit?.buildingId ?? null}
          initStartAt={aiSpaceInit?.startAt ?? null}
          initEndAt={aiSpaceInit?.endAt ?? null}
          onSuccess={() => {
            setSpaceSubTab('list');
            setSearchParams({ tab: TAB.SPACE, sub: 'list' });
            if (clearAiSpaceInit) clearAiSpaceInit();
          }}
        />
      )}
      {spaceSubTab === 'list' && (
        <SpaceReservationList
          inlineMode
          onGoCreate={() => {
            setSpaceSubTab('create');
            setSearchParams({ tab: TAB.SPACE, sub: 'create' });
          }}
        />
      )}
    </div>
  );
}

// ── 섹션 헤더 컴포넌트 ────────────────────────────────────────
function SectionHeader({ eyebrow, title }) {
  return (
    <div className={styles.sectionHead} style={{ marginBottom: 20 }}>
      <div className={styles.sectionTitleGroup}>
        <span className={styles.sectionEyebrow}>{eyebrow}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
    </div>
  );
}

// ── InfoRow 헬퍼 ──────────────────────────────────────────────
function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoVal}>{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function MemberInfo() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();

  const urlTab = searchParams.get('tab') || TAB.ME;
  const urlSub = searchParams.get('sub') || '';

  const [activeTab, setActiveTab] = useState(urlTab);
  const [myRoomSubTab, setMyRoomSubTab] = useState(
    urlTab === TAB.MYROOM && urlSub === 'rent-payment'
      ? 'rent-payment'
      : 'contracts'
  );
  const [spaceSubTab, setSpaceSubTab] = useState(
    urlTab === TAB.SPACE && urlSub === 'list' ? 'list' : 'create'
  );
  const [postsSubTab, setPostsSubTab] = useState(
    urlTab === TAB.POSTS && urlSub === 'support' ? 'support' : 'community'
  );
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    const tab = searchParams.get('tab') || TAB.ME;
    const sub = searchParams.get('sub') || '';
    setActiveTab(tab);
    if (tab === TAB.MYROOM)
      setMyRoomSubTab(sub === 'rent-payment' ? 'rent-payment' : 'contracts');
    if (tab === TAB.SPACE) setSpaceSubTab(sub === 'list' ? 'list' : 'create');
    if (tab === TAB.POSTS)
      setPostsSubTab(sub === 'support' ? 'support' : 'community');
  }, [searchParams]);

  const goTab = (tab, sub) => {
    const p = { tab };
    if (sub) p.sub = sub;
    setSearchParams(p);
    setActiveTab(tab);
  };

  const handleSideClick = (key) => {
    if (key === TAB.TOUR) {
      setTourCreateOpen(true);
      return;
    }
    goTab(key);
  };

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loading}>불러오는 중</div>
      </div>
    );
  }

  // 유저 이니셜
  const initials = (user?.userNm || user?.name || 'U')
    .slice(0, 1)
    .toUpperCase();

  // 역할 한국어 라벨
  const getRoleLabel = (u) => {
    const raw =
      u?.userRole ??
      u?.role ??
      u?.userRl ??
      u?.authority ??
      u?.authorities?.[0] ??
      '';
    const normalized = String(raw).toLowerCase().replace('role_', '');
    const roleMap = {
      admin: '관리자',
      tenant: '입주자',
      user: '일반 회원',
      guest: '게스트',
    };
    return roleMap[normalized] || '회원';
  };

  return (
    <div className={styles.page}>
      <Header />

      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroSideLine} />
        <div className={styles.heroContent}>
          <div className={styles.heroInner}>
            <p className={styles.heroEyebrow}>UNI-PLACE · MY PAGE</p>
            <div className={styles.heroLine} />
            <h1 className={styles.heroTitle}>마이페이지</h1>
            <p className={styles.heroSub}>
              계약, 결제, 예약 등 나의 모든 활동을 한 곳에서 관리하세요.
            </p>
          </div>
        </div>
        <div className={styles.heroFade} />
      </div>

      {/* ── 레이아웃 ── */}
      <div className={styles.container}>
        {/* ── 사이드바 ── */}
        <aside className={styles.side}>
          {/* 프로필 카드 */}
          <div className={styles.profileCard}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{initials}</div>
              <div>
                <div className={styles.profileName}>
                  {user?.userNm || user?.name || '사용자'}
                </div>
                <div className={styles.profileEmail}>
                  {user?.userEmail || ''}
                </div>
              </div>
            </div>
            <div className={styles.profileStats}>
              <div className={styles.profileStat}>
                <div className={`${styles.profileStatVal} ${styles.gold}`}>
                  {getRoleLabel(user)}
                </div>
                <div className={styles.profileStatLbl}>회원 등급</div>
              </div>
              {user?.userNickname && (
                <div className={styles.profileStat}>
                  <div className={styles.profileStatVal}>
                    {user.userNickname}
                  </div>
                  <div className={styles.profileStatLbl}>닉네임</div>
                </div>
              )}
            </div>
          </div>

          {/* 내비게이션 */}
          <nav className={styles.sideNav}>
            <div className={styles.sideNavHeader}>Navigation</div>
            {SIDE_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.sideItem} ${activeTab === item.key && item.key !== TAB.TOUR ? styles.sideItemActive : ''}`}
                onClick={() => handleSideClick(item.key)}
              >
                <span
                  className={styles.sideItemDot}
                  style={{ background: item.dot }}
                />
                <span className={styles.sideItemLabel}>{item.label}</span>
                <span className={styles.sideItemArrow}>›</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── 콘텐츠 ── */}
        <section className={styles.content}>
          {activeTab === TAB.ME && <MeTab user={user} />}

          {activeTab === TAB.MYROOM && (
            <div>
              <SectionHeader eyebrow="Contract" title="내 계약" />
              <div className={styles.subTabRow}>
                <button
                  type="button"
                  className={`${styles.subTab} ${myRoomSubTab === 'contracts' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setMyRoomSubTab('contracts');
                    setSearchParams({ tab: TAB.MYROOM, sub: 'contracts' });
                  }}
                >
                  내 계약
                </button>
                <button
                  type="button"
                  className={`${styles.subTab} ${myRoomSubTab === 'rent-payment' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setMyRoomSubTab('rent-payment');
                    setSearchParams({ tab: TAB.MYROOM, sub: 'rent-payment' });
                  }}
                >
                  월세 결제
                </button>
              </div>
              {myRoomSubTab === 'contracts' && <MyContractView noOverlay />}
              {myRoomSubTab === 'rent-payment' && (
                <MyMonthlyCharges
                  focusContractId={searchParams.get('contractId')}
                />
              )}
            </div>
          )}

          {activeTab === TAB.POSTS && (
            <div>
              <SectionHeader eyebrow="Posts" title="작성 목록" />
              <div className={styles.subTabRow}>
                <button
                  type="button"
                  className={`${styles.subTab} ${postsSubTab === 'community' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setPostsSubTab('community');
                    setSearchParams({ tab: TAB.POSTS, sub: 'community' });
                  }}
                >
                  커뮤니티
                </button>
                <button
                  type="button"
                  className={`${styles.subTab} ${postsSubTab === 'support' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setPostsSubTab('support');
                    setSearchParams({ tab: TAB.POSTS, sub: 'support' });
                  }}
                >
                  고객센터
                </button>
              </div>
              {postsSubTab === 'community' && <MyPosts />}
              {postsSubTab === 'support' && <SupportPostsTab />}
            </div>
          )}

          {activeTab === TAB.SPACE && (
            <SpaceTab
              spaceSubTab={spaceSubTab}
              setSpaceSubTab={setSpaceSubTab}
              setSearchParams={setSearchParams}
              aiSpaceInit={null}
              clearAiSpaceInit={null}
            />
          )}

          {activeTab === TAB.ROOMSERVICE && (
            <div>
              <SectionHeader eyebrow="Room Service" title="룸서비스" />
              <RoomServiceTab />
            </div>
          )}

          {activeTab === TAB.PAYMENT && (
            <div>
              <SectionHeader eyebrow="Payment" title="결제 내역" />
              <MyPaymentHistory inlineMode />
            </div>
          )}
        </section>
      </div>

      {/* ── 사전 방문 팝업 ── */}
      <Modal
        open={tourCreateOpen}
        onClose={() => setTourCreateOpen(false)}
        title="사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          onGoList={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onSuccess={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onClose={() => setTourCreateOpen(false)}
        />
      </Modal>
      <Modal
        open={tourListOpen}
        onClose={() => setTourListOpen(false)}
        title="방문 예약 조회"
        size="lg"
      >
        <TourReservationList
          inlineMode
          onGoCreate={() => {
            setTourListOpen(false);
            setTourCreateOpen(true);
          }}
          onClose={() => setTourListOpen(false)}
        />
      </Modal>

      {/* ── 모바일 하단 탭바 (1024px 이하에서 표시) ── */}
      <nav className={styles.mobileTabBar}>
        {SIDE_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.mobileTabItem} ${
              activeTab === item.key && item.key !== TAB.TOUR
                ? styles.mobileTabItemActive
                : ''
            }`}
            onClick={() => handleSideClick(item.key)}
          >
            <span
              className={styles.mobileTabDot}
              style={{
                background: activeTab === item.key ? item.dot : undefined,
              }}
            />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
