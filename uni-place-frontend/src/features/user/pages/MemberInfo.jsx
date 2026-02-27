import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header'; // 프로젝트 경로에 맞게 조정
import styles from './MemberInfo.module.css';

import { authApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

// tokenStore가 이미 src/app/http/tokenStore.js 에 있으면 그걸 쓰는 게 베스트
// 경로가 다르면 아래 import 경로만 맞춰줘.
import { getOrCreateDeviceId } from '../../../app/http/tokenStore'; // 프로젝트 경로에 맞게 조정

// ── 추가된 import ──────────────────────────────────────────────
import Modal from '../../../shared/components/Modal/Modal';
import SpaceReservationCreate from '../../reservation/pages/SpaceReservationCreate';
import SpaceReservationList from '../../reservation/pages/SpaceReservationList';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

export default function MemberInfo() {
  const navigate = useNavigate();
  const { user, loading, refresh, logout } = useAuth();

  // ── 추가된 state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('me'); // 'me' | 'space'
  const [spaceSubTab, setSpaceSubTab] = useState('create'); // 'create' | 'list'
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const [meLoading, setMeLoading] = useState(true);

  // 서버에서 받은 내 정보(원본)
  const [origin, setOrigin] = useState(null);

  // 폼 상태
  const [form, setForm] = useState({
    userNm: '',
    userEmail: '',
    userTel: '',
    userId: '',
  });

  // 비밀번호 입력(표시는 공백 처리)
  const [currentPwd, setCurrentPwd] = useState(''); // 현재 비밀번호(확인용)
  const [newPwd, setNewPwd] = useState(''); // 변경할 비밀번호

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // 로그인 안 돼있으면 로그인 화면으로
  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  // 내 정보 조회
  const loadMe = useCallback(async () => {
    setError('');
    setMsg('');
    setMeLoading(true);
    try {
      const me = await authApi.me(); // GET /users/me (unwrap된 data 리턴)
      setOrigin(me ?? null);

      setForm({
        userNm: me?.userNm ?? '',
        userEmail: me?.userEmail ?? '',
        userTel: me?.userTel ?? '',
        userId: me?.userId ?? '',
      });
    } catch (e) {
      setError(e?.message || '내 정보 조회에 실패했습니다.');
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) loadMe();
  }, [loading, user, loadMe]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // 변경된 필드만 골라서 PATCH payload 만들기
  const patchPayload = useMemo(() => {
    if (!origin) return null;

    const payload = {};
    const nextNm = form.userNm?.trim() ?? '';
    const nextEmail = form.userEmail?.trim() ?? '';
    const nextTel = form.userTel?.trim() ?? '';

    if (nextNm && nextNm !== (origin.userNm ?? '')) payload.userNm = nextNm;
    if (nextEmail && nextEmail !== (origin.userEmail ?? ''))
      payload.userEmail = nextEmail;
    if (nextTel && nextTel !== (origin.userTel ?? ''))
      payload.userTel = nextTel;

    // ✅ 비밀번호 변경은 newPwd가 있을 때만 + currentUserPwd도 같이 보내야 함
    if (newPwd && newPwd.trim().length > 0) {
      payload.userPwd = newPwd.trim();
      payload.currentUserPwd = currentPwd.trim(); // ✅ 핵심 수정
    }

    return payload;
  }, [
    origin,
    form.userNm,
    form.userEmail,
    form.userTel,
    newPwd,
    currentPwd, // ✅ 이거도 추가 권장
  ]);

  const hasChanges = useMemo(() => {
    if (!patchPayload) return false;
    return Object.keys(patchPayload).length > 0;
  }, [patchPayload]);

  const onClickReset = useCallback(() => {
    if (!origin) return;
    setError('');
    setMsg('');
    setCurrentPwd('');
    setNewPwd('');

    setForm({
      userNm: origin.userNm ?? '',
      userEmail: origin.userEmail ?? '',
      userTel: origin.userTel ?? '',
      userId: origin.userId ?? '',
    });
  }, [origin]);

  // ✅ 수정(적용) 버튼 로직
  // 1) 변경사항 없으면 취소 처리(메시지만)
  // 2) 현재 비밀번호로 "재로그인" 시도 → 성공하면 비번 일치로 간주
  // 3) PATCH /users/me
  const onSubmitUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setMsg('');

      if (!origin) return;

      if (!hasChanges) {
        setMsg('변경된 내용이 없어 취소 처리되었습니다.');
        return;
      }

      const email = (origin.userEmail || '').trim();
      if (!email) {
        setError('이메일이 비어있습니다.');
        return;
      }

      // 비밀번호 변경 또는 정보 변경 시, 현재 비밀번호 확인 요구
      if (!currentPwd.trim()) {
        setError('수정을 위해 현재 비밀번호를 입력해주세요.');
        return;
      }

      try {
        setSubmitting(true);

        // ✅ 현재 비밀번호 확인: login 재호출로 검증
        // 성공하면 토큰이 새로 발급될 수 있음(오히려 안전)
        const deviceId = getOrCreateDeviceId();

        await authApi.login({
          userEmail: origin.userEmail,
          userPwd: currentPwd,
          deviceId,
        });

        // ✅ 변경 PATCH
        await authApi.updateMe(patchPayload);

        // 화면/컨텍스트 갱신
        await refresh?.();
        await loadMe();

        setCurrentPwd('');
        setNewPwd('');
        setMsg('수정이 완료되었습니다.');
      } catch (err) {
        // login 실패(401) or update 실패(409 duplicate 등)
        setError(err?.message || '수정에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
    },
    [
      origin,
      hasChanges,
      form.userEmail,
      currentPwd,
      patchPayload,
      refresh,
      loadMe,
    ]
  );

  const onWithdraw = useCallback(async () => {
    setError('');
    setMsg('');

    if (!window.confirm('정말 탈퇴하시겠어요?')) return;

    try {
      setSubmitting(true);
      await authApi.deleteMe(); // DELETE /users/me (delete_yn='Y' 처리 기대)
      await logout(); // 토큰 정리
      navigate('/', { replace: true });
    } catch (e) {
      setError(e?.message || '탈퇴에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }, [logout, navigate]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.container}>
        <aside className={styles.side}>
          <div className={styles.sideBox}>
            {/* 내 정보 ~ 작성 목록: 기존 그대로 */}
            <button
              type="button"
              className={`${styles.sideItem} ${styles.sideItemActive}`}
              onClick={() => navigate('/me')}
            >
              내 정보
            </button>
            <button
              type="button"
              className={styles.sideItem}
              onClick={() => navigate('/myroom')}
            >
              마이룸
            </button>
            <button
              type="button"
              className={styles.sideItem}
              onClick={() => navigate('/my/posts')}
            >
              작성 목록
            </button>

            {/* 공용 시설: 탭 전환으로 변경 */}
            <button
              type="button"
              className={`${styles.sideItem} ${activeTab === 'space' ? styles.sideItemActive : ''}`}
              onClick={() => setActiveTab('space')}
            >
              공용 시설
            </button>

            {/* 사전 방문: 팝업으로 변경 */}
            <button
              type="button"
              className={styles.sideItem}
              onClick={() => setTourCreateOpen(true)}
            >
              사전 방문
            </button>

            {/* 룸서비스: 기존 그대로 */}
            <button
              type="button"
              className={styles.sideItem}
              onClick={() => navigate('/commerce/room-service')}
            >
              룸서비스
            </button>
          </div>
        </aside>

        <section className={styles.content}>
          {/* ── 내 정보 탭 ── */}
          {activeTab === 'me' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>본인 정보</h1>
              </div>

              {meLoading ? (
                <div className={styles.loading}>불러오는 중…</div>
              ) : (
                <form className={styles.form} onSubmit={onSubmitUpdate}>
                  <div className={styles.panel}>
                    <Field label="이름">
                      <input
                        className={styles.input}
                        name="userNm"
                        value={form.userNm}
                        placeholder="이름"
                        readOnly
                        disabled
                      />
                    </Field>

                    <Field label="이메일">
                      <input
                        className={styles.input}
                        name="userEmail"
                        value={form.userEmail}
                        onChange={onChange}
                        placeholder="이메일"
                        disabled={submitting}
                      />
                    </Field>

                    <Field label="전화번호">
                      <input
                        className={styles.input}
                        name="userTel"
                        value={form.userTel}
                        onChange={onChange}
                        placeholder="전화번호"
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

                    {/* 기존 비밀번호는 표시하지 않음(공백처럼 보이게) */}
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
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="변경할 비밀번호 (선택)"
                        autoComplete="new-password"
                        disabled={submitting}
                      />
                    </Field>

                    {error ? <div className={styles.error}>{error}</div> : null}
                    {msg ? <div className={styles.msg}>{msg}</div> : null}

                    <div className={styles.actions}>
                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={submitting || meLoading}
                      >
                        {submitting ? '수정 중…' : '수정'}
                      </button>

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
                </form>
              )}
            </div>
          )}

          {/* ── 공용 시설 탭 ── */}
          {activeTab === 'space' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h1 className={styles.title}>🛋️ 공용 시설 예약</h1>
              </div>
              <div className={styles.subTabRow}>
                <button
                  type="button"
                  className={`${styles.subTab} ${spaceSubTab === 'create' ? styles.subTabActive : ''}`}
                  onClick={() => setSpaceSubTab('create')}
                >
                  예약 생성
                </button>
                <button
                  type="button"
                  className={`${styles.subTab} ${spaceSubTab === 'list' ? styles.subTabActive : ''}`}
                  onClick={() => setSpaceSubTab('list')}
                >
                  내 예약 조회
                </button>
              </div>
              {spaceSubTab === 'create' && (
                <SpaceReservationCreate
                  inlineMode
                  onSuccess={() => setSpaceSubTab('list')}
                />
              )}
              {spaceSubTab === 'list' && (
                <SpaceReservationList
                  inlineMode
                  onGoCreate={() => setSpaceSubTab('create')}
                />
              )}
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
