// src/features/commerce/pages/Checkout.jsx
// 주문 정보 입력 + 결제 수단 선택
// - 만나서 결제: POST /orders → 바로 주문 완료
// - 카카오페이: POST /orders → POST /api/payments/prepare → 카카오페이 URL 리다이렉트

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useCart } from '../hooks/useCart';
import { useOrderCreate } from '../hooks/useOrders';
import { authApi } from '../../user/api/authApi';
import { api } from '../../../app/http/axiosInstance';
import ConfirmModal from './components/ConfirmModal';
import styles from './Checkout.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';

const SIDE_MENUS = [
  { label: '내 정보', path: '/me' },
  { label: '마이룸', path: '/myroom' },
  { label: '작성 목록', path: '/my/posts' },
  { label: '공용 시설', path: '/facilities' },
  { label: '사전 방문', path: '/tour' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

async function prepareKakaoPay(orderId) {
  const res = await api.post('/api/payments/prepare', {
    orderId,
    provider: 'KAKAO',
  });
  const body = res?.data;
  if (body?.success === false)
    throw new Error(body.message || '결제 준비 실패');
  return body?.data ?? body;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [payMethod, setPayMethod] = useState(null); // 'meet' | 'kakao'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState(false); // 최종 결제 확인 모달

  // 내 정보로 이름/전화번호 자동완성
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

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.roomNo.trim()) return '방 번호를 입력해주세요.';
    if (!form.name.trim()) return '이름을 입력해주세요.';
    if (!form.phone.trim()) return '전화번호를 입력해주세요.';
    if (!payMethod) return '결제 수단을 선택해주세요.';
    return null;
  };

  // 결제 버튼 클릭 → 유효성 검사 → 확인 모달
  const handleClickPay = () => {
    setError('');
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setConfirmModal(true);
  };

  // 모달 확인 → 실제 결제 처리
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
        // 만나서 결제: 주문 생성 → 완료 페이지
        await createOrder({ items: orderItems, roomServiceDesc: desc });
        await clear();
        navigate('/commerce/orders', {
          state: { toastMsg: '주문이 완료되었습니다! 곧 배달해 드릴게요 🛎' },
        });
      } else if (payMethod === 'kakao') {
        // 카카오페이: 주문 생성 → prepare → 리다이렉트
        const order = await createOrder({
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

  const isActive = (p) => location.pathname === p;

  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        {/* 사이드 메뉴 */}
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.path}
                className={`${layoutStyles.sideItem} ${isActive(m.path) ? layoutStyles.sideItemActive : ''}`}
                onClick={() => navigate(m.path)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </aside>

        {/* 콘텐츠 */}
        <section className={layoutStyles.content}>
          <div className={layoutStyles.card}>
            {/* 헤더 */}
            <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() => navigate('/commerce/cart')}
              >
                ← 장바구니
              </button>
              <h1 className={styles.title}>주문 정보 입력</h1>
              <div style={{ width: 88 }} />
            </div>

            <div className={styles.body}>
              {/* ── 주문 상품 요약 ── */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span>🛍</span> 주문 상품
                </h2>
                <div className={styles.orderBox}>
                  {items.map((item) => (
                    <div key={item.cartItemId} className={styles.orderItem}>
                      <span className={styles.oiName}>{item.prodNm}</span>
                      <span className={styles.oiQty}>
                        × {item.orderQuantity}
                      </span>
                      <span className={styles.oiAmt}>
                        {fmt(item.lineTotal)}원
                      </span>
                    </div>
                  ))}
                  <div className={styles.orderTotalRow}>
                    <span className={styles.oTotalLabel}>합계</span>
                    <span className={styles.oTotalAmt}>{fmt(total)}원</span>
                  </div>
                </div>
              </section>

              {/* ── 배달 정보 ── */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span>🏠</span> 배달 정보
                </h2>
                <div className={styles.formBlock}>
                  <div className={styles.fieldRow}>
                    <label className={styles.label}>
                      방 번호 <span className={styles.req}>*</span>
                    </label>
                    <div className={styles.inputUnit}>
                      <input
                        className={styles.input}
                        name="roomNo"
                        value={form.roomNo}
                        onChange={onChange}
                        placeholder="예) 301"
                        maxLength={10}
                        disabled={submitting}
                      />
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

              {/* ── 결제 수단 ── */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <span>💳</span> 결제 수단
                </h2>
                <div className={styles.payMethods}>
                  {/* 만나서 결제 */}
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

                  {/* 카카오페이 */}
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

              {/* 에러 */}
              {error && (
                <div className={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* 결제 버튼 */}
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
        </section>
      </main>

      {/* ── 최종 결제 확인 모달 ── */}
      {confirmModal && (
        <ConfirmModal
          title={
            payMethod === 'meet'
              ? '만나서 결제로 주문할까요?'
              : '카카오페이 결제를 진행할까요?'
          }
          desc={
            payMethod === 'meet'
              ? `${form.roomNo}호  ·  ${form.name}  ·  ${fmt(total)}원\n배달 후 현장에서 결제합니다.`
              : `${form.roomNo}호  ·  ${form.name}  ·  ${fmt(total)}원\n카카오페이 결제창으로 이동합니다.`
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
    </div>
  );
}
