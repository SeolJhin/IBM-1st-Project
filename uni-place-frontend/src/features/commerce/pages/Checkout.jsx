// src/features/commerce/pages/Checkout.jsx
// inlineMode: MemberInfo 탭 내에서 사용 시 true

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useCart } from '../hooks/useCart';
import { useOrderCreate } from '../hooks/useOrders';
import { authApi } from '../../user/api/authApi';
import { api } from '../../../app/http/axiosInstance';
import { buildingApi } from '../../../app/http/buildingApi';
import ConfirmModal from './components/ConfirmModal';
import styles from './Checkout.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

async function prepareKakaoPay(orderId) {
  const res = await api.post('/payments/prepare', {
    orderId,
    provider: 'KAKAO',
  });
  const body = res?.data;
  if (body?.success === false)
    throw new Error(body.message || '결제 준비 실패');
  return body?.data ?? body;
}

function roomStLabel(st) {
  switch (st) {
    case 'available':
      return '입주가능';
    case 'contracted':
      return '계약중';
    case 'reserved':
      return '예약중';
    case 'repair':
      return '수리중';
    case 'cleaning':
      return '청소중';
    default:
      return st ?? '';
  }
}

export default function Checkout({
  inlineMode = false,
  onNav,
  buildingId: propBuildingId,
  buildingNm: propBuildingNm,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const go = (path, state) => {
    if (inlineMode && onNav) onNav(path, state);
    else navigate(path, state ? { state } : undefined);
  };

  const selectedBuildingId =
    propBuildingId ?? location.state?.selectedBuildingId ?? null;
  const selectedBuildingNm =
    propBuildingNm ?? location.state?.selectedBuildingNm ?? '';

  const { cart, clear } = useCart();
  const { createOrder } = useOrderCreate();
  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? 0;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    roomNo: '',
    desc: '',
  });
  const [payMethod, setPayMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((me) =>
        setForm((p) => ({
          ...p,
          name: p.name || me?.userNm || '',
          phone: p.phone || me?.userTel || '',
        }))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) {
      setRooms([]);
      return;
    }
    setRoomsLoading(true);
    setForm((p) => ({ ...p, roomNo: '' }));
    buildingApi
      .getRooms(selectedBuildingId, {
        size: 200,
        sort: 'roomNo',
        direct: 'ASC',
      })
      .then((res) => {
        const data = res?.data?.data ?? res?.data ?? {};
        const list = data?.content ?? data ?? [];
        setRooms(Array.isArray(list) ? list : []);
      })
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [selectedBuildingId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!selectedBuildingId)
      return '빌딩 정보가 없습니다. 상품 목록으로 돌아가 빌딩을 선택해주세요.';
    if (!form.roomNo.trim()) return '방 번호를 선택해주세요.';
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!form.phone.trim()) return '전화번호를 입력해주세요.';
    if (!payMethod) return '결제 수단을 선택해주세요.';
    return null;
  };

  const handleClickPay = () => {
    setError('');
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setConfirmModal(true);
  };

  const handleConfirmPay = async () => {
    setSubmitting(true);
    setError('');
    try {
      const desc = `[${form.roomNo}호] ${form.name} / ${form.phone}${form.desc ? ' / ' + form.desc : ''}`;
      const orderItems = items.map((i) => ({
        prodId: i.prodId,
        orderQuantity: i.orderQuantity,
      }));
      if (payMethod === 'meet') {
        await createOrder({
          buildingId: selectedBuildingId,
          items: orderItems,
          roomServiceDesc: desc,
        });
        await clear();
        go('/commerce/orders', {
          toastMsg: '주문이 완료되었습니다! 곧 배달해 드릴게요 🛎',
        });
      } else if (payMethod === 'kakao') {
        const order = await createOrder({
          buildingId: selectedBuildingId,
          items: orderItems,
          roomServiceDesc: desc,
        });
        const pay = await prepareKakaoPay(order.orderId);
        const url = pay.redirectPcUrl || pay.redirectMobileUrl;
        if (!url) throw new Error('카카오페이 URL을 받지 못했습니다.');
        await clear();
        window.location.href = url;
      }
    } catch (e) {
      setError(e.message || '결제 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const inner = (
    <div>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() =>
            go('/commerce/cart', { selectedBuildingId, selectedBuildingNm })
          }
        >
          ← 장바구니
        </button>
        <h1 className={styles.title}>주문 정보 입력</h1>
        <div style={{ width: 88 }} />
      </div>
      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span>🛍</span> 주문 상품
          </h2>
          <div className={styles.orderBox}>
            {items.map((item) => (
              <div key={item.cartItemId} className={styles.orderItem}>
                <span className={styles.oiName}>{item.prodNm}</span>
                <span className={styles.oiQty}>× {item.orderQuantity}</span>
                <span className={styles.oiAmt}>{fmt(item.lineTotal)}원</span>
              </div>
            ))}
            <div className={styles.orderTotalRow}>
              <span className={styles.oTotalLabel}>합계</span>
              <span className={styles.oTotalAmt}>{fmt(total)}원</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span>🏠</span> 배달 정보
          </h2>
          <div className={styles.formBlock}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                배달 빌딩 <span className={styles.req}>*</span>
              </label>
              <div className={styles.buildingDisplay}>
                {selectedBuildingNm ? (
                  <span className={styles.buildingSelected}>
                    🏢 {selectedBuildingNm}
                    <button
                      type="button"
                      className={styles.changeBuildingBtn}
                      onClick={() =>
                        go('/commerce/room-service', {
                          selectedBuildingId,
                          selectedBuildingNm,
                        })
                      }
                      disabled={submitting}
                    >
                      변경
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.noBuildingBtn}
                    onClick={() => go('/commerce/room-service')}
                    disabled={submitting}
                  >
                    ⚠ 빌딩을 선택하세요 →
                  </button>
                )}
              </div>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                방 번호 <span className={styles.req}>*</span>
              </label>
              <div className={styles.inputUnit}>
                {roomsLoading ? (
                  <span className={styles.roomLoading}>
                    방 목록 불러오는 중…
                  </span>
                ) : rooms.length > 0 ? (
                  <select
                    className={styles.select}
                    name="roomNo"
                    value={form.roomNo}
                    onChange={onChange}
                    disabled={submitting || !selectedBuildingId}
                  >
                    <option value="">방 번호를 선택하세요</option>
                    {rooms.map((r) => (
                      <option key={r.roomId} value={String(r.roomNo)}>
                        {r.roomNo}호 ({r.floor}층 · {roomStLabel(r.roomSt)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={styles.input}
                    name="roomNo"
                    value={form.roomNo}
                    onChange={onChange}
                    placeholder="예) 301"
                    maxLength={10}
                    disabled={submitting || !selectedBuildingId}
                  />
                )}
                <span className={styles.unitText}>호</span>
              </div>
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                이름 <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.input}
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="주문자 이름"
                disabled={submitting}
              />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>
                전화번호 <span className={styles.req}>*</span>
              </label>
              <input
                className={styles.input}
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="010-0000-0000"
                disabled={submitting}
              />
            </div>
            <div
              className={styles.fieldRow}
              style={{ alignItems: 'flex-start' }}
            >
              <label className={styles.label} style={{ paddingTop: 10 }}>
                기타 요청사항
              </label>
              <textarea
                className={styles.textarea}
                name="desc"
                value={form.desc}
                onChange={onChange}
                placeholder="문 앞에 놓아주세요 등 (선택)"
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span>💳</span> 결제 수단
          </h2>
          <div className={styles.payMethods}>
            <button
              className={`${styles.payCard} ${payMethod === 'meet' ? styles.payCardOn : ''}`}
              onClick={() => setPayMethod('meet')}
              disabled={submitting}
              type="button"
            >
              <span className={styles.payEmoji}>🤝</span>
              <div className={styles.payText}>
                <span className={styles.payName}>만나서 결제</span>
                <span className={styles.paySubtitle}>
                  배달 후 현장에서 결제
                </span>
              </div>
              <div
                className={`${styles.radio} ${payMethod === 'meet' ? styles.radioOn : ''}`}
              />
            </button>
            <button
              className={`${styles.payCard} ${styles.payCardKakao} ${payMethod === 'kakao' ? styles.payCardKakaoOn : ''}`}
              onClick={() => setPayMethod('kakao')}
              disabled={submitting}
              type="button"
            >
              <span className={styles.payEmoji}>💛</span>
              <div className={styles.payText}>
                <span className={styles.payName}>카카오페이</span>
                <span className={styles.paySubtitle}>
                  카카오페이 결제창으로 이동
                </span>
              </div>
              <div
                className={`${styles.radio} ${styles.radioKakao} ${payMethod === 'kakao' ? styles.radioKakaoOn : ''}`}
              />
            </button>
          </div>
        </section>

        {error && (
          <div className={styles.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          className={`${styles.payBtn} ${payMethod === 'kakao' ? styles.payBtnKakao : ''}`}
          onClick={handleClickPay}
          disabled={submitting || !items.length}
          type="button"
        >
          {submitting
            ? '처리 중…'
            : payMethod === 'meet'
              ? `✅  ${fmt(total)}원  만나서 결제로 주문하기`
              : payMethod === 'kakao'
                ? `💛  ${fmt(total)}원  카카오페이로 결제하기`
                : `${fmt(total)}원  결제 수단 선택 후 진행`}
        </button>
      </div>
    </div>
  );

  const modals = (
    <>
      {confirmModal && (
        <ConfirmModal
          title={
            payMethod === 'meet'
              ? '만나서 결제로 주문할까요?'
              : '카카오페이 결제를 진행할까요?'
          }
          desc={
            payMethod === 'meet'
              ? `${selectedBuildingNm} · ${form.roomNo}호  ·  ${form.name}  ·  ${fmt(total)}원\n배달 후 현장에서 결제합니다.`
              : `${selectedBuildingNm} · ${form.roomNo}호  ·  ${form.name}  ·  ${fmt(total)}원\n카카오페이 결제창으로 이동합니다.`
          }
          confirmLabel={payMethod === 'meet' ? '주문하기' : '결제하기'}
          cancelLabel="다시 확인"
          danger={false}
          onConfirm={async () => {
            setConfirmModal(false);
            await handleConfirmPay();
          }}
          onCancel={() => setConfirmModal(false)}
        />
      )}
      <Modal
        open={tourCreateOpen}
        onGoList={() => {
          setTourCreateOpen(false);
          setTourListOpen(true);
        }}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
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
    </>
  );

  if (inlineMode)
    return (
      <>
        {inner}
        {modals}
      </>
    );

  const SIDE_MENUS = [
    { label: '내 정보', path: '/me?tab=me' },
    { label: '마이룸', path: '/me?tab=myroom' },
    { label: '작성 목록', path: '/me?tab=posts' },
    { label: '공용 시설', path: '/me?tab=space' },
    { label: '사전 방문', path: '__TOUR_POPUP__' },
    { label: '룸서비스', path: '/commerce/room-service' },
  ];
  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.label}
                className={layoutStyles.sideItem}
                onClick={() =>
                  m.path === '__TOUR_POPUP__'
                    ? setTourCreateOpen(true)
                    : navigate(m.path)
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>
        <section className={layoutStyles.content}>{inner}</section>
      </main>
      {modals}
    </div>
  );
}
