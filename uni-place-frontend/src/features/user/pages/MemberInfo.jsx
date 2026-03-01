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
              <MyPosts />
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
