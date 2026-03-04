import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useCart } from '../hooks/useCart';
import { useOrderCreate } from '../hooks/useOrders';
import { useTenantContract } from '../hooks/useTenantContract';
import { authApi } from '../../user/api/authApi';
import { api } from '../../../app/http/axiosInstance';
import ConfirmModal from './components/ConfirmModal';
import styles from './Checkout.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

const ORDER_SERVICE_GOODS_ID = 1;

async function prepareKakaoPay(orderId) {
  const res = await api.post('/payments/prepare', {
    serviceGoodsId: ORDER_SERVICE_GOODS_ID,
    orderId,
    provider: 'KAKAO',
  });
  const body = res?.data;
  if (body?.success === false) {
    throw new Error(body.message || '결제 준비에 실패했습니다.');
  }
  return body?.data ?? body;
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

  const fallbackBuildingId =
    propBuildingId ?? location.state?.selectedBuildingId ?? null;
  const fallbackBuildingNm =
    propBuildingNm ?? location.state?.selectedBuildingNm ?? '';

  const {
    contracts: tenantContracts,
    loading: tenantLoading,
    error: tenantError,
  } = useTenantContract();

  const { cart, clear } = useCart();
  const { createOrder } = useOrderCreate();
  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? 0;
  const cartBuildingId = items[0]?.buildingId ?? null;
  const selectedBuildingId =
    fallbackBuildingId ?? cartBuildingId ?? tenantContracts[0]?.buildingId ?? null;
  const selectedBuildingNm =
    fallbackBuildingNm ||
    tenantContracts.find((c) => c?.buildingId === selectedBuildingId)?.buildingNm ||
    '';
  const roomContracts = tenantContracts.filter(
    (c) => c?.buildingId === selectedBuildingId && c?.roomId != null
  );
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const selectedRoomContract = roomContracts.find(
    (c) => c.roomId === selectedRoomId
  );

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

  useEffect(() => {
    authApi
      .me()
      .then((me) =>
        setForm((prev) => ({
          ...prev,
          name: prev.name || me?.userNm || '',
          phone: prev.phone || me?.userTel || '',
        }))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedRoomId((prev) => {
      if (prev && roomContracts.some((c) => c.roomId === prev)) return prev;
      return roomContracts[0]?.roomId ?? null;
    });
  }, [roomContracts]);

  useEffect(() => {
    if (!selectedRoomContract?.roomNo) return;
    setForm((prev) => ({ ...prev, roomNo: String(selectedRoomContract.roomNo) }));
  }, [selectedRoomContract?.roomNo]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoomSelect = (e) => {
    const nextRoomId = e.target.value ? Number(e.target.value) : null;
    setSelectedRoomId(nextRoomId);
    const matched = roomContracts.find((c) => c.roomId === nextRoomId);
    setForm((prev) => ({
      ...prev,
      roomNo: matched?.roomNo ? String(matched.roomNo) : '',
    }));
  };

  const validate = () => {
    if (tenantLoading) return '입주 계약 정보를 확인 중입니다.';
    if (!tenantContracts.length) {
      return tenantError || '현재 입주 중인 계약이 없어 룸서비스 주문이 불가합니다.';
    }
    if (!selectedBuildingId) {
      return '빌딩 정보를 확인하지 못했습니다.';
    }
    if (!selectedRoomId || !selectedRoomContract) {
      return '계약된 호실을 선택해주세요.';
    }
    if (!form.roomNo.trim()) {
      return '호실 정보를 확인하지 못했습니다.';
    }
    if (!form.name.trim()) {
      return '이름을 입력해주세요.';
    }
    if (!form.phone.trim()) {
      return '전화번호를 입력해주세요.';
    }
    if (!payMethod) {
      return '결제 수단을 선택해주세요.';
    }
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
      const desc = `[${form.roomNo}호] ${form.name} / ${form.phone}${form.desc ? ` / ${form.desc}` : ''}`;
      const orderItems = items.map((item) => ({
        prodId: item.prodId,
        orderQuantity: item.orderQuantity,
      }));

      if (payMethod === 'meet') {
        await createOrder({
          buildingId: selectedBuildingId,
          roomId: selectedRoomId,
          items: orderItems,
          roomServiceDesc: desc,
        });
        await clear();
        go('/commerce/orders', {
          toastMsg: '주문이 완료되었습니다. 곧 배달해드릴게요.',
        });
      } else if (payMethod === 'kakao') {
        const order = await createOrder({
          buildingId: selectedBuildingId,
          roomId: selectedRoomId,
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
            <span>🧾</span> 주문 상품
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
            <span>🚚</span> 배달 정보
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
                    + 빌딩을 선택해주세요
                  </button>
                )}
              </div>
            </div>

            <div className={styles.fieldRow}>
              <label className={styles.label}>
                방 번호 <span className={styles.req}>*</span>
              </label>
              <div className={styles.inputUnit}>
                <select
                  className={styles.select}
                  value={selectedRoomId ?? ''}
                  onChange={handleRoomSelect}
                  disabled={submitting || roomContracts.length === 0}
                >
                  <option value="">계약된 호실 선택</option>
                  {roomContracts.map((c) => (
                    <option key={c.contractId ?? c.roomId} value={c.roomId}>
                      {c.roomNo}호
                    </option>
                  ))}
                </select>
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

            <div className={styles.fieldRow} style={{ alignItems: 'flex-start' }}>
              <label className={styles.label} style={{ paddingTop: 10 }}>
                기타 요청사항
              </label>
              <textarea
                className={styles.textarea}
                name="desc"
                value={form.desc}
                onChange={onChange}
                placeholder="문 앞에 놓아주세요. (선택)"
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
              <span className={styles.payEmoji}>💵</span>
              <div className={styles.payText}>
                <span className={styles.payName}>만나서 결제</span>
                <span className={styles.paySubtitle}>배달 시 현장에서 결제</span>
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
              <span className={styles.payEmoji}>🟡</span>
              <div className={styles.payText}>
                <span className={styles.payName}>카카오페이</span>
                <span className={styles.paySubtitle}>카카오페이 결제창으로 이동</span>
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
          disabled={submitting || !items.length || tenantLoading}
          type="button"
        >
          {submitting
            ? '처리 중...'
            : payMethod === 'meet'
              ? `💵 ${fmt(total)}원 만나서 결제로 주문하기`
              : payMethod === 'kakao'
                ? `🟡 ${fmt(total)}원 카카오페이로 결제하기`
                : `${fmt(total)}원 결제 수단 선택 후 진행`}
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
              ? `${selectedBuildingNm} · ${form.roomNo}호 · ${form.name} · ${fmt(total)}원\n배달 시 현장에서 결제됩니다.`
              : `${selectedBuildingNm} · ${form.roomNo}호 · ${form.name} · ${fmt(total)}원\n카카오페이 결제창으로 이동합니다.`
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
        title="🧭 사전 방문 예약"
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

  if (inlineMode) {
    return (
      <>
        {inner}
        {modals}
      </>
    );
  }

  const SIDE_MENUS = [
    { label: '회원정보', path: '/me?tab=me' },
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
            {SIDE_MENUS.map((menu) => (
              <button
                key={menu.label}
                className={layoutStyles.sideItem}
                onClick={() =>
                  menu.path === '__TOUR_POPUP__'
                    ? setTourCreateOpen(true)
                    : navigate(menu.path)
                }
              >
                {menu.label}
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
