// features/user/pages/MemberInfo.jsx
// 마이페이지 메인 — 사이드 탭 전환 방식
// 각 탭 컴포넌트는 해당 피처 폴더에 위치:
//   마이룸    → features/contract/pages/MyContractView.jsx
//   작성목록  → features/community/pages/MyPosts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import styles from './MemberInfo.module.css';

import { authApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';

// ── 탭 컴포넌트 import ────────────────────────────────────────
import MyContractView from '../../contract/pages/MyContractView';
import MyPosts from '../../community/pages/MyPosts';
import { useQnas } from '../../support/hooks/useQnas';
import { useComplains } from '../../support/hooks/useComplains';
import ProductList from '../../commerce/pages/ProductList';
import Cart from '../../commerce/pages/Cart';
import Checkout from '../../commerce/pages/Checkout';
import OrderList from '../../commerce/pages/OrderList';
import OrderDetail from '../../commerce/pages/OrderDetail';

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
};

const SIDE_ITEMS = [
  { key: TAB.ME, label: '내 정보' },
  { key: TAB.MYROOM, label: '마이룸' },
  { key: TAB.POSTS, label: '작성 목록' },
  { key: TAB.SPACE, label: '공용 시설' },
  { key: TAB.TOUR, label: '사전 방문' },
  { key: TAB.ROOMSERVICE, label: '룸서비스' },
];

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
  });
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadMe = React.useCallback(async () => {
    setError('');
    setMsg('');
    setMeLoading(true);
    try {
      const me = await authApi.me();
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

  // 변경된 필드만 payload 구성
  const buildPayload = React.useCallback(() => {
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
    if (newPwd?.trim()) {
      payload.userPwd = newPwd.trim();
      payload.currentUserPwd = currentPwd.trim();
    }
    return payload;
  }, [origin, form.userNm, form.userEmail, form.userTel, newPwd, currentPwd]);

  const onSubmitUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (!origin) return;
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
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="변경할 비밀번호 (선택)"
              autoComplete="new-password"
              disabled={submitting}
            />
          </Field>
          {error && <div className={styles.error}>{error}</div>}
          {msg && <div className={styles.msg}>{msg}</div>}
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
          질문 / 답변
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

function SpaceTab({ spaceSubTab, setSpaceSubTab, setSearchParams }) {
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
          }}
        >
          내 예약 조회
        </button>
      </div>
      {spaceSubTab === 'create' && (
        <SpaceReservationCreate
          inlineMode
          onSuccess={() => {
            setSpaceSubTab('list');
            setSearchParams({ tab: TAB.SPACE, sub: 'list' });
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
                <h1 className={styles.title}>🏠 마이룸</h1>
              </div>
              <MyContractView />
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
            />
          )}

          {activeTab === TAB.ROOMSERVICE && (
            <div className={styles.card}>
              <RoomServiceTab />
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
