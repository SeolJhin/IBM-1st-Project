// features/user/pages/MemberInfo.jsx
// 마이페이지 메인 — 사이드 탭 전환 방식
// 각 탭 컴포넌트는 해당 피처 폴더에 위치:
//   마이룸    → features/contract/pages/MyContractView.jsx
//   작성목록  → features/community/pages/MyPosts.jsx
import React, { useEffect, useState } from 'react';
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

// ── 탭 컴포넌트 import ────────────────────────────────────────
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
  { key: TAB.ME, label: '내 정보' },
  { key: TAB.MYROOM, label: '내 계약' },
  { key: TAB.POSTS, label: '작성 목록' },
  { key: TAB.SPACE, label: '공용 시설' },
  { key: TAB.TOUR, label: '사전 방문' },
  { key: TAB.ROOMSERVICE, label: '룸서비스' },
  { key: TAB.PAYMENT, label: '결제 내역' },
];

const SOCIAL_PROVIDER_ORDER = ['kakao', 'google'];
const SOCIAL_PROVIDER_LABEL = {
  kakao: '카카오',
  google: '구글',
};

// ── 내 정보 탭 (로컬) ─────────────────────────────────────────
function MeTab() {
  const navigate = useNavigate();
  const { user, loading, refresh, logout } = useAuth();
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
  const [faceCount, setFaceCount] = useState(null); // null=미조회, 0=미등록, 1~5=등록수
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [originalNickname, setOriginalNickname] = useState('');
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialLinks, setSocialLinks] = useState({
    kakao: false,
    google: false,
  });

  const loadMe = React.useCallback(async () => {
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

      const linkedProviderSet = new Set(
        (socialAccounts || [])
          .map((item) => String(item?.provider || '').toLowerCase())
          .filter(Boolean)
      );
      const nextSocialLinks = {
        kakao: linkedProviderSet.has('kakao'),
        google: linkedProviderSet.has('google'),
      };
      setSocialLinks(nextSocialLinks);

      const currentUrl = new URL(window.location.href);
      const linkedProvider = String(
        currentUrl.searchParams.get('linked') || ''
      ).toLowerCase();
      const linkError = String(
        currentUrl.searchParams.get('linkError') || ''
      ).toLowerCase();
      if (linkedProvider) {
        const label = SOCIAL_PROVIDER_LABEL[linkedProvider] || linkedProvider;
        if (nextSocialLinks[linkedProvider]) {
          setMsg(`${label} 연동이 완료되었습니다.`);
        } else {
          setError(
            `${label} 연동을 확인하지 못했습니다. 동일 이메일 계정인지 확인 후 다시 시도해주세요.`
          );
        }
        currentUrl.searchParams.delete('linked');
        window.history.replaceState(
          {},
          '',
          `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
        );
      }
      if (linkError) {
        setError(
          '소셜 계정 연동에 실패했습니다. 현재 비밀번호를 다시 확인하고, 이미 다른 계정에 연동된 소셜인지 확인해주세요.'
        );
        currentUrl.searchParams.delete('linkError');
        window.history.replaceState(
          {},
          '',
          `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
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
    if (!loading && user) loadMe();
  }, [loading, user, loadMe]);

  // 드롭다운 바깥 클릭 시 닫기
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
      const { authApi } = await import('../api/authApi');
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

  // 변경된 필드만 payload 구성
  const buildPayload = React.useCallback(() => {
    if (!origin) return null;
    const payload = {};
    const nextNm = form.userNm?.trim() ?? '';
    const nextEmail = form.userEmail?.trim() ?? '';
    const nextTel = form.userTel?.trim() ?? '';
    const nextNickname = form.userNickname?.trim() ?? '';
    if (nextNm && nextNm !== (origin.userNm ?? '')) payload.userNm = nextNm;
    if (nextEmail && nextEmail !== (origin.userEmail ?? ''))
      payload.userEmail = nextEmail;
    if (nextTel && nextTel !== (origin.userTel ?? ''))
      payload.userTel = nextTel;
    if (nextNickname && nextNickname !== (origin.userNickname ?? ''))
      payload.userNickname = nextNickname;
    if (newPwd?.trim()) {
      payload.userPwd = newPwd.trim();
      payload.currentUserPwd = currentPwd.trim();
    }
    return payload;
  }, [
    origin,
    form.userNm,
    form.userEmail,
    form.userTel,
    form.userNickname,
    newPwd,
    currentPwd,
  ]);

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!origin) return;

    // ── 새 비밀번호: 입력한 경우 무조건 형식 검사 ──────────────
    if (newPwd.trim()) {
      const pwdErr = validatePassword(newPwd.trim());
      if (pwdErr) return setError(pwdErr);
    }

    // ── 전화번호: 현재 입력값 형식 검사 (변경 여부와 무관) ───────
    if (form.userTel.trim()) {
      const telErr = validatePhone(form.userTel.trim());
      if (telErr) return setError(telErr);
    }

    // ── 이메일: 현재 입력값 형식 검사 ───────────────────────────
    if (form.userEmail.trim()) {
      const emailErr = validateEmail(form.userEmail.trim());
      if (emailErr) return setError(emailErr);
    }

    // ── 닉네임 변경 시 중복확인 필요 ────────────────────────────
    const nextNickname = form.userNickname?.trim() ?? '';
    if (nextNickname !== (origin.userNickname ?? '').trim()) {
      const nickErr = validateNickname(nextNickname);
      if (nickErr) return setError(nickErr);
      if (!nicknameChecked) return setError('닉네임 중복 확인을 해주세요.');
    }

    const payload = buildPayload();
    if (!payload || Object.keys(payload).length === 0) {
      setMsg('변경된 내용이 없어 취소 처리되었습니다.');
      return;
    }

    // ── 현재 비밀번호는 항상 필요 ────────────────────────────────
    if (!currentPwd.trim()) {
      setError('수정을 위해 현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const passwordChanged = Boolean(payload.userPwd);
      await authApi.updateMe(payload);
      if (passwordChanged) {
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
      } catch (e) {
        // best effort
      }
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
    const normalized = String(provider || '').toLowerCase();
    if (!SOCIAL_PROVIDER_ORDER.includes(normalized)) return;

    if (socialLinks[normalized]) {
      setMsg(
        `${SOCIAL_PROVIDER_LABEL[normalized]} 연동이 이미 완료되어 있습니다.`
      );
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
        provider: normalized,
        currentUserPwd: currentPwd.trim(),
        returnTo: `/me?tab=me&linked=${normalized}`,
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
    const normalized = String(provider || '').toLowerCase();
    if (!SOCIAL_PROVIDER_ORDER.includes(normalized)) return;
    if (!socialLinks[normalized]) {
      setError(
        `${SOCIAL_PROVIDER_LABEL[normalized]}은(는) 아직 연동되지 않았습니다.`
      );
      return;
    }
    if (!currentPwd.trim()) {
      setError('소셜 연동 해제를 위해 현재 비밀번호를 입력해주세요.');
      return;
    }
    if (
      !window.confirm(
        `${SOCIAL_PROVIDER_LABEL[normalized]} 연동을 해제하시겠습니까?`
      )
    ) {
      return;
    }

    setError('');
    setMsg('');
    try {
      setLinkSubmitting(true);
      await authApi.unlinkSocialAccount({
        provider: normalized,
        currentUserPwd: currentPwd.trim(),
      });
      await loadMe();
      setMsg(`${SOCIAL_PROVIDER_LABEL[normalized]} 연동이 해제되었습니다.`);
    } catch (e) {
      setError(
        e?.koreanMessage || e?.message || '소셜 연동 해제에 실패했습니다.'
      );
    } finally {
      setLinkSubmitting(false);
    }
  };

  if (meLoading) return <div className={styles.loading}>불러오는 중…</div>;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>본인 정보</h1>
      </div>
      <form className={styles.form} onSubmit={onSubmitUpdate}>
        <div className={styles.panel}>
          <Field label="이름">
            <input
              className={styles.input}
              name="userNm"
              value={form.userNm}
              readOnly
              disabled
            />
          </Field>
          <Field label="닉네임">
            <div style={{ display: 'flex', gap: 8 }}>
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
                  padding: '0 12px',
                  borderRadius: 8,
                  background: nicknameChecked ? '#22c55e' : '#111',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  height: 40,
                }}
              >
                {nicknameStatus === 'checking'
                  ? '확인 중…'
                  : nicknameChecked
                    ? '✓ 확인됨'
                    : '중복확인'}
              </button>
            </div>
            {nicknameStatus === 'dup' && (
              <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                이미 사용 중인 닉네임입니다.
              </div>
            )}
            {nicknameStatus === 'ok' && (
              <div style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>
                사용 가능한 닉네임입니다.
              </div>
            )}
          </Field>
          <Field label="이메일">
            <input
              className={styles.input}
              name="userEmail"
              value={form.userEmail}
              onChange={onChange}
              disabled={submitting}
            />
          </Field>
          <Field label="전화번호">
            <input
              className={styles.input}
              name="userTel"
              value={form.userTel}
              onChange={onChange}
              disabled={submitting}
            />
          </Field>
          <Field label="아이디">
            <input
              className={styles.input}
              name="userId"
              value={form.userId}
              readOnly
              disabled
            />
          </Field>
          <Field label="비밀번호">
            <input
              className={styles.input}
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="현재 비밀번호를 입력해주세요"
              autoComplete="current-password"
              disabled={submitting}
            />
          </Field>
          <Field label="변경할 비밀번호">
            <input
              className={styles.input}
              type="password"
              value={newPwd}
              onChange={(e) => {
                const v = e.target.value;
                setNewPwd(v);
                setPwdChecks({
                  length: v.length >= 8,
                  letter: /[a-zA-Z]/.test(v),
                  number: /[0-9]/.test(v),
                  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v),
                });
              }}
              placeholder="영문 + 숫자 + 특수기호 포함 8자 이상 (선택)"
              autoComplete="new-password"
              disabled={submitting}
            />
            {newPwd && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px 12px',
                  marginTop: 6,
                }}
              >
                {[
                  { key: 'length', label: '8자 이상' },
                  { key: 'letter', label: '영문자' },
                  { key: 'number', label: '숫자' },
                  { key: 'special', label: '특수기호' },
                ].map(({ key, label }) => (
                  <span
                    key={key}
                    style={{
                      fontSize: 12,
                      color: pwdChecks[key] ? '#22c55e' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    {pwdChecks[key] ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            )}
          </Field>
          {error && <div className={styles.error}>{error}</div>}
          {msg && <div className={styles.msg}>{msg}</div>}
          <div className={styles.actions}>
            <div className={styles.socialActions}>
              {SOCIAL_PROVIDER_ORDER.map((provider) => {
                const linked = Boolean(socialLinks[provider]);
                return (
                  <button
                    key={provider}
                    type="button"
                    className={styles.socialLinkBtn}
                    onClick={() =>
                      linked
                        ? unlinkSocialAccount(provider)
                        : startSocialLink(provider)
                    }
                    disabled={
                      submitting || linkSubmitting || meLoading || socialLoading
                    }
                  >
                    {SOCIAL_PROVIDER_LABEL[provider]}{' '}
                    {linked ? '연동 해제' : '연동'}
                  </button>
                );
              })}
            </div>
            <div className={styles.primaryActions}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting || meLoading}
              >
                {submitting ? '수정 중…' : '수정'}
              </button>
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
                  👤 페이스로그인 ▾
                </button>
                {faceMenu && (
                  <div className={styles.faceDropdown}>
                    <div className={styles.faceDropHeader}>
                      등록된 얼굴&nbsp;
                      <strong>
                        {faceCount === null ? '…' : `${faceCount} / 5`}
                      </strong>
                    </div>
                    <button
                      className={styles.faceDropItem}
                      disabled={faceCount >= 5}
                      onClick={() => {
                        setFaceMenu(false);
                        setFaceRegModal(true);
                      }}
                    >
                      ✏️ 얼굴 등록
                      <span className={styles.faceDropSub}>
                        {faceCount >= 5
                          ? '최대 등록 수 도달 (삭제 후 재등록)'
                          : '화장·안경 등 다양한 상태로 등록'}
                      </span>
                    </button>
                    <button
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
                      🗑️ {faceDeleting ? '삭제 중…' : '얼굴 삭제'}
                      <span className={styles.faceDropSub}>
                        {faceCount === 0
                          ? '등록된 얼굴 없음'
                          : '등록 데이터 전체 제거'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.withdrawBtn}
                onClick={onWithdraw}
                disabled={submitting || meLoading}
              >
                탈퇴
              </button>
            </div>
          </div>
        </div>
      </form>

      {faceRegModal && (
        <FaceLoginModal
          mode="register"
          email={user?.userEmail || user?.email || ''}
          onSuccess={() => {
            setFaceRegModal(false);
            setFaceCount((c) => (c ?? 0) + 1);
            setMsg(
              '얼굴 등록이 완료되었습니다. 다음 로그인부터 얼굴 인식을 사용할 수 있습니다.'
            );
          }}
          onClose={() => setFaceRegModal(false)}
        />
      )}
    </div>
  );
}

// ── 공용 시설 탭 (로컬) ───────────────────────────────────────
// ── 고객센터 작성 목록 탭 ─────────────────────────────────────
function QnaInline() {
  const { qnas, pagination, loading, error, goToPage } = useQnas();
  const navigate = useNavigate();

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const STATUS_MAP = { waiting: '답변대기', complete: '답변완료' };

  return (
    <div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.10)' }}>
            {['번호', '제목', '상태', '날짜'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'rgba(0,0,0,0.55)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {qnas.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'rgba(0,0,0,0.4)',
                  fontSize: 14,
                }}
              >
                작성된 문의가 없습니다.
              </td>
            </tr>
          ) : (
            qnas.map((q) => (
              <tr
                key={q.qnaId}
                onClick={() => navigate(`/support/qna/${q.qnaId}`)}
                style={{
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.4)',
                    width: 60,
                  }}
                >
                  {q.qnaId}
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    maxWidth: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {q.qnaTitle}
                </td>
                <td style={{ padding: '12px', width: 100 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        q.qnaSt === 'complete' ? '#FFCD8E' : 'rgba(0,0,0,0.08)',
                      color:
                        q.qnaSt === 'complete' ? '#362F20' : 'rgba(0,0,0,0.6)',
                    }}
                  >
                    {STATUS_MAP[q.qnaSt] ?? q.qnaSt}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.4)',
                    width: 100,
                  }}
                >
                  {q.createdAt ? q.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}
        >
          <button
            className={styles.cancelBtn}
            style={{ minWidth: 60, height: 36 }}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.cancelBtn}
            style={{ minWidth: 60, height: 36 }}
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

function ComplainInline() {
  const { complains, pagination, loading, error, goToPage } = useComplains();
  const navigate = useNavigate(); // ✅ 위로 올림

  if (loading) return <div className={styles.loading}>불러오는 중…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const STATUS_MAP = { in_progress: '처리중', resolved: '처리완료' };

  return (
    <div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.10)' }}>
            {['번호', '제목', '상태', '날짜'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'rgba(0,0,0,0.55)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {complains.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: 'rgba(0,0,0,0.4)',
                  fontSize: 14,
                }}
              >
                접수된 민원이 없습니다.
              </td>
            </tr>
          ) : (
            complains.map((item) => (
              <tr
                key={item.compId}
                onClick={() => navigate(`/support/complain/${item.compId}`)}
                style={{
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                }}
              >
                <td
                  style={{
                    padding: '12px',
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.4)',
                    width: 60,
                  }}
                >
                  {item.compId}
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: 14,
                    fontWeight: 600,
                    maxWidth: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.compTitle}
                </td>
                <td style={{ padding: '12px', width: 100 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        item.compSt === 'resolved'
                          ? '#FFCD8E'
                          : 'rgba(0,0,0,0.08)',
                      color:
                        item.compSt === 'resolved'
                          ? '#362F20'
                          : 'rgba(0,0,0,0.6)',
                    }}
                  >
                    {STATUS_MAP[item.compSt] ?? item.compSt}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px',
                    fontSize: 13,
                    color: 'rgba(0,0,0,0.4)',
                    width: 100,
                  }}
                >
                  {item.createdAt ? item.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            marginTop: 20,
          }}
        >
          <button
            className={styles.cancelBtn}
            style={{ minWidth: 60, height: 36 }}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.cancelBtn}
            style={{ minWidth: 60, height: 36 }}
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

function SupportPostsTab() {
  const [supportSub, setSupportSub] = React.useState('qna');

  return (
    <div>
      <div className={styles.subTabRow} style={{ marginTop: 8 }}>
        <button
          type="button"
          className={`${styles.subTab} ${supportSub === 'qna' ? styles.subTabActive : ''}`}
          onClick={() => setSupportSub('qna')}
        >
          1:1 문의
        </button>
        <button
          type="button"
          className={`${styles.subTab} ${supportSub === 'complain' ? styles.subTabActive : ''}`}
          onClick={() => setSupportSub('complain')}
        >
          민원
        </button>
      </div>

      {supportSub === 'qna' && <QnaInline />}
      {supportSub === 'complain' && <ComplainInline />}
    </div>
  );
}

// ── 룸서비스 탭 (서브뷰: product → cart → checkout → orders → orderDetail) ─
function RoomServiceTab() {
  const [view, setView] = React.useState('product'); // 'product'|'cart'|'checkout'|'orders'|'orderDetail'
  const [navState, setNavState] = React.useState({});
  const [toastMsg, setToastMsg] = React.useState('');

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
      const id = Number(path.split('/').pop());
      setNavState((prev) => ({ ...prev, orderId: id }));
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

function SpaceTab({
  spaceSubTab,
  setSpaceSubTab,
  setSearchParams,
  aiSpaceInit,
  clearAiSpaceInit,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>🛋️ 공용 시설 예약</h1>
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

// ── 메인 컴포넌트 ─────────────────────────────────────────────
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

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  // URL → 탭 동기화
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

  // 로딩 중이거나 미인증이면 자식 탭(SpaceReservationCreate 등) 렌더 차단
  // → contractApi/reservationApi가 401로 터져서 에러페이지+흰화면 되는 것 방지
  if (loading || !user) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loading}>불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        {/* ── 사이드 메뉴 ── */}
        <aside className={styles.side}>
          <div className={styles.sideBox}>
            {SIDE_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.sideItem} ${
                  activeTab === item.key && item.key !== TAB.TOUR
                    ? styles.sideItemActive
                    : ''
                }`}
                onClick={() => handleSideClick(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ── 콘텐츠 영역 ── */}
        <section className={styles.content}>
          {activeTab === TAB.ME && <MeTab />}

          {activeTab === TAB.MYROOM && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>{'\uB0B4 \uACC4\uC57D'}</h1>
              </div>

              <div className={styles.subTabRow}>
                <button
                  type="button"
                  className={`${styles.subTab} ${myRoomSubTab === 'contracts' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setMyRoomSubTab('contracts');
                    setSearchParams({ tab: TAB.MYROOM, sub: 'contracts' });
                  }}
                >
                  {'\uB0B4 \uACC4\uC57D'}
                </button>
                <button
                  type="button"
                  className={`${styles.subTab} ${myRoomSubTab === 'rent-payment' ? styles.subTabActive : ''}`}
                  onClick={() => {
                    setMyRoomSubTab('rent-payment');
                    setSearchParams({ tab: TAB.MYROOM, sub: 'rent-payment' });
                  }}
                >
                  {'\uC6D4\uC138 \uACB0\uC81C'}
                </button>
              </div>

              {myRoomSubTab === 'contracts' && <MyContractView />}
              {myRoomSubTab === 'rent-payment' && (
                <MyMonthlyCharges
                  focusContractId={searchParams.get('contractId')}
                />
              )}
            </div>
          )}

          {activeTab === TAB.POSTS && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>📝 작성 목록</h1>
              </div>

              {/* 1단계 서브탭: 커뮤니티 | 고객센터 */}
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
            <div className={styles.card}>
              <RoomServiceTab />
            </div>
          )}

          {activeTab === TAB.PAYMENT && (
            <div className={styles.card}>
              <MyPaymentHistory />
            </div>
          )}
        </section>
      </main>

      {/* ── 사전 방문 예약 생성 팝업 ── */}
      <Modal
        open={tourCreateOpen}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
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

      {/* ── 사전 방문 예약 조회 팝업 ── */}
      <Modal
        open={tourListOpen}
        onClose={() => setTourListOpen(false)}
        title="📋 방문 예약 조회"
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
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className={styles.row}>
      <div className={styles.rowLabel}>{label}</div>
      <div className={styles.rowInput}>{children}</div>
    </label>
  );
}
