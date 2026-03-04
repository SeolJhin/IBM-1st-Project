// src/features/commerce/pages/Cart.jsx
// inlineMode: MemberInfo 탭 내에서 사용 시 true

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useCart } from '../hooks/useCart';
import { commerceApi } from '../api/commerceApi';
import ConfirmModal from './components/ConfirmModal';
import styles from './Cart.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

function fmt(price) {
  return price == null ? '0' : Number(price).toLocaleString('ko-KR');
}

function extractStockMap(products, buildingId) {
  if (!products || !buildingId) return {};
  const m = {};
  products.forEach((p) => {
    const stock =
      p.buildingStocks?.[Number(buildingId)] ??
      p.buildingStocks?.[buildingId] ??
      null;
    m[p.prodId] = stock;
  });
  return m;
}

function CartItemRow({
  item,
  stock,
  applying,
  onChangeQty,
  onRemove,
  actionLoading,
}) {
  const localQty = item.orderQuantity;
  const [inputStr, setInputStr] = useState(String(localQty));
  const isFocused = useRef(false);
  useEffect(() => {
    if (!isFocused.current) setInputStr(String(localQty));
  }, [localQty]);

  const maxQty = stock != null ? stock : 9999;
  const atMax = stock != null && localQty >= stock;
  const lineTotal = Number(item.orderPrice) * localQty;

  const setQty = (v) => {
    const clamped = Math.max(1, Math.min(v, maxQty));
    if (clamped !== localQty) onChangeQty(item, clamped);
    if (!isFocused.current) setInputStr(String(clamped));
  };

  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.prodNm}</span>
        <span className={styles.itemUnit}>{fmt(item.orderPrice)}원 / 개</span>
        {stock != null && stock > 0 && stock <= 5 && (
          <span className={styles.stockWarn}>재고 {stock}개 남음</span>
        )}
        {stock === 0 && <span className={styles.stockOut}>품절</span>}
      </div>
      <div className={styles.qtyWrap}>
        <button
          className={styles.qtyBtn}
          onClick={() => setQty(localQty - 1)}
          disabled={actionLoading || applying || localQty <= 1}
        >
          −
        </button>
        <input
          className={styles.qtyInput}
          type="text"
          inputMode="numeric"
          value={isFocused.current ? inputStr : String(localQty)}
          onChange={(e) => setInputStr(e.target.value.replace(/[^0-9]/g, ''))}
          onFocus={() => {
            isFocused.current = true;
            setInputStr(String(localQty));
          }}
          onBlur={() => {
            isFocused.current = false;
            const parsed = parseInt(inputStr, 10);
            const clamped = Math.max(
              1,
              Math.min(isNaN(parsed) ? 1 : parsed, maxQty)
            );
            setInputStr(String(clamped));
            if (clamped !== localQty) onChangeQty(item, clamped);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
          }}
          disabled={actionLoading || applying || stock === 0}
        />
        <button
          className={styles.qtyBtn}
          onClick={() => {
            if (atMax) {
              alert(`재고가 부족합니다. (최대 ${stock}개)`);
              return;
            }
            setQty(localQty + 1);
          }}
          disabled={actionLoading || applying || atMax || stock === 0}
        >
          +
        </button>
      </div>
      <span className={styles.itemTotal}>{fmt(lineTotal)}원</span>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item)}
        disabled={actionLoading || applying}
      >
        ✕
      </button>
    </div>
  );
}

export default function Cart({
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

  const { cart, loading, error, actionLoading, updateItem, removeItem, clear } =
    useCart();
  const items = useMemo(() => cart?.items ?? [], [cart]);

  const [stockMap, setStockMap] = useState({});
  const [stockLoading, setStockLoading] = useState(false);
  useEffect(() => {
    if (!selectedBuildingId) return;
    setStockLoading(true);
    commerceApi
      .getProducts()
      .then((data) =>
        setStockMap(extractStockMap(data ?? [], selectedBuildingId))
      )
      .catch(() => setStockMap({}))
      .finally(() => setStockLoading(false));
  }, [selectedBuildingId]);

  const [applyingId, setApplyingId] = useState(null);

  const handleChangeQty = useCallback(
    async (item, newQty) => {
      const stock = stockMap[item.prodId] ?? null;
      if (stock !== null && newQty > stock) {
        alert(`[${item.prodNm}] 재고 초과입니다. (재고: ${stock}개)`);
        return;
      }
      setApplyingId(item.cartItemId);
      try {
        await updateItem(item.cartItemId, { quantity: newQty });
      } catch (e) {
        alert(e.message || '수량 변경에 실패했습니다.');
      } finally {
        setApplyingId(null);
      }
    },
    [stockMap, updateItem]
  );

  const [modal, setModal] = useState(null);
  const handleRemove = (item) =>
    setModal({
      title: '상품 제거',
      desc: `"${item.prodNm}"을(를) 장바구니에서 제거할까요?`,
      onConfirm: async () => {
        await removeItem(item.cartItemId);
      },
    });
  const handleClear = () =>
    setModal({
      title: '장바구니 비우기',
      desc: '담아두신 상품을 모두 제거할까요?',
      onConfirm: async () => {
        await clear();
      },
    });

  const handleGoCheckout = () => {
    if (!selectedBuildingId) {
      alert('빌딩 정보가 없습니다. 상품 목록으로 돌아가 빌딩을 선택해주세요.');
      go('/commerce/room-service');
      return;
    }
    go('/commerce/checkout', { selectedBuildingId, selectedBuildingNm });
  };

  const { localTotalQty, localTotalAmt } = useMemo(() => {
    let qty = 0,
      amt = 0;
    items.forEach((i) => {
      const q = i.orderQuantity;
      qty += q;
      amt += Number(i.orderPrice) * q;
    });
    return { localTotalQty: qty, localTotalAmt: amt };
  }, [items]);

  const inner = (
    <div>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() =>
            go('/commerce/room-service', {
              selectedBuildingId,
              selectedBuildingNm,
            })
          }
        >
          ← 상품 목록
        </button>
        <h1 className={styles.title}>장바구니</h1>
        {items.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={handleClear}
            disabled={actionLoading}
          >
            전체 비우기
          </button>
        )}
      </div>
      {selectedBuildingNm && (
        <div className={styles.buildingBadge}>🏢 {selectedBuildingNm} 배달</div>
      )}
      {(loading || stockLoading) && (
        <div className={styles.center}>
          <span className={styles.spin} />
        </div>
      )}
      {error && <p className={styles.errMsg}>{error}</p>}
      {!loading && items.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🛒</div>
          <p className={styles.emptyText}>장바구니가 비어 있어요</p>
          <button
            className={styles.goShopBtn}
            onClick={() => go('/commerce/room-service')}
          >
            상품 담으러 가기
          </button>
        </div>
      )}
      {items.length > 0 && (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                stock={stockMap[item.prodId] ?? null}
                applying={applyingId === item.cartItemId}
                onChangeQty={handleChangeQty}
                onRemove={handleRemove}
                actionLoading={actionLoading}
              />
            ))}
          </div>
          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>총 {localTotalQty}개</span>
            <span className={styles.totalAmt}>{fmt(localTotalAmt)}원</span>
          </div>
          <button
            className={styles.nextBtn}
            onClick={handleGoCheckout}
            disabled={actionLoading || !!applyingId}
          >
            주문 정보 입력 →
          </button>
        </>
      )}
    </div>
  );

  const modals = (
    <>
      {modal && (
        <ConfirmModal
          title={modal.title}
          desc={modal.desc}
          onConfirm={async () => {
            await modal.onConfirm();
            setModal(null);
          }}
          onCancel={() => setModal(null)}
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
                className={`${layoutStyles.sideItem}`}
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

