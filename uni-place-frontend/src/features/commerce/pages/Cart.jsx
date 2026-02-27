// src/features/commerce/pages/Cart.jsx
//
// ✅ 수량은 로컬 qtyMap에서만 관리 (즉시 API 호출 X)
// ✅ "적용" 버튼 클릭 시 API 호출
// ✅ 재고 초과 방지: ProductList와 동일한 방식 (Number 키 방어)

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

const SIDE_MENUS = [
  { label: '내 정보', path: '/me' },
  { label: '마이룸', path: '/myroom' },
  { label: '작성 목록', path: '/my/posts' },
  { label: '공용 시설', path: '/me?tab=space' },
  { label: '사전 방문', path: '__TOUR_POPUP__' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

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

// ── 아이템 행 ─────────────────────────────────────────────────────────────
function CartItemRow({
  item,
  localQty,
  stock,
  applying,
  onSetQty,
  onApply,
  onRemove,
  actionLoading,
}) {
  const [inputStr, setInputStr] = useState(String(localQty));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setInputStr(String(localQty));
  }, [localQty]);

  const maxQty = stock != null ? stock : 9999;
  const isDirty = localQty !== item.orderQuantity;
  const atMax = stock != null && localQty >= stock;
  const lineTotal = Number(item.orderPrice) * localQty;

  const setQty = (v) => {
    const clamped = Math.max(1, Math.min(v, maxQty));
    onSetQty(item.cartItemId, clamped);
    if (!isFocused.current) setInputStr(String(clamped));
  };

  const handleInputBlur = () => {
    isFocused.current = false;
    const parsed = parseInt(inputStr, 10);
    const clamped = Math.max(1, Math.min(isNaN(parsed) ? 1 : parsed, maxQty));
    setInputStr(String(clamped));
    if (clamped !== localQty) onSetQty(item.cartItemId, clamped);
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
          aria-label="수량 감소"
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
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
          }}
          disabled={actionLoading || applying || stock === 0}
          aria-label="수량"
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
          aria-label="수량 증가"
        >
          +
        </button>

        {isDirty && (
          <button
            className={styles.applyBtn}
            onClick={() => onApply(item, localQty)}
            disabled={actionLoading || applying}
          >
            {applying ? '적용 중…' : '적용'}
          </button>
        )}
      </div>

      <span className={styles.itemTotal}>{fmt(lineTotal)}원</span>

      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item)}
        disabled={actionLoading || applying}
        aria-label={`${item.prodNm} 삭제`}
      >
        ✕
      </button>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);
  const location = useLocation();

  const selectedBuildingId = location.state?.selectedBuildingId ?? null;
  const selectedBuildingNm = location.state?.selectedBuildingNm ?? '';

  const { cart, loading, error, actionLoading, updateItem, removeItem, clear } =
    useCart();
  const items = useMemo(() => cart?.items ?? [], [cart]);

  // ── 재고 맵 ─────────────────────────────────────────────────────────
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

  // ── 로컬 수량 맵 ─────────────────────────────────────────────────────
  const [qtyMap, setQtyMap] = useState({});
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    setQtyMap((prev) => {
      const next = { ...prev };
      items.forEach((i) => {
        if (applyingId !== i.cartItemId) {
          next[i.cartItemId] = i.orderQuantity;
        }
      });
      return next;
    });
  }, [items, applyingId]);

  const handleSetQty = useCallback((cartItemId, qty) => {
    setQtyMap((prev) => ({ ...prev, [cartItemId]: qty }));
  }, []);

  // ── 수량 적용 ────────────────────────────────────────────────────────
  const handleApply = useCallback(
    async (item, newQty) => {
      const stock = stockMap[item.prodId] ?? null;
      if (stock !== null && newQty > stock) {
        alert(`[${item.prodNm}] 재고 초과입니다. (재고: ${stock}개)`);
        setQtyMap((prev) => ({
          ...prev,
          [item.cartItemId]: item.orderQuantity,
        }));
        return;
      }
      setApplyingId(item.cartItemId);
      try {
        await updateItem(item.cartItemId, { quantity: newQty });
      } catch (e) {
        alert(e.message || '수량 변경에 실패했습니다.');
        setQtyMap((prev) => ({
          ...prev,
          [item.cartItemId]: item.orderQuantity,
        }));
      } finally {
        setApplyingId(null);
      }
    },
    [stockMap, updateItem]
  );

  // ── 모달 ─────────────────────────────────────────────────────────────
  const [modal, setModal] = useState(null);

  const handleRemove = (item) => {
    setModal({
      title: '상품 제거',
      desc: `"${item.prodNm}"을(를) 장바구니에서 제거할까요?`,
      onConfirm: async () => {
        await removeItem(item.cartItemId);
      },
    });
  };

  const handleClear = () => {
    setModal({
      title: '장바구니 비우기',
      desc: '담아두신 상품을 모두 제거할까요?',
      onConfirm: async () => {
        await clear();
      },
    });
  };

  // ── 주문으로 ─────────────────────────────────────────────────────────
  const handleGoCheckout = () => {
    if (!selectedBuildingId) {
      alert('빌딩 정보가 없습니다. 상품 목록으로 돌아가 빌딩을 선택해주세요.');
      navigate('/commerce/room-service');
      return;
    }
    const hasDirty = items.some(
      (i) => (qtyMap[i.cartItemId] ?? i.orderQuantity) !== i.orderQuantity
    );
    if (hasDirty) {
      const ok = window.confirm(
        '수량 변경 중 적용하지 않은 항목이 있습니다.\n그대로 주문하시겠습니까?'
      );
      if (!ok) return;
    }
    navigate('/commerce/checkout', {
      state: { selectedBuildingId, selectedBuildingNm },
    });
  };

  // ── 합계 (로컬 수량 기준) ────────────────────────────────────────────
  const { localTotalQty, localTotalAmt } = useMemo(() => {
    let qty = 0,
      amt = 0;
    items.forEach((i) => {
      const q = qtyMap[i.cartItemId] ?? i.orderQuantity;
      qty += q;
      amt += Number(i.orderPrice) * q;
    });
    return { localTotalQty: qty, localTotalAmt: amt };
  }, [items, qtyMap]);

  const isActive = (p) => location.pathname === p;

  return (
    <div className={layoutStyles.page}>
      <Header />
      <main className={layoutStyles.container}>
        <aside className={layoutStyles.side}>
          <div className={layoutStyles.sideBox}>
            {SIDE_MENUS.map((m) => (
              <button
                key={m.label}
                className={`${layoutStyles.sideItem} ${isActive(m.path) ? layoutStyles.sideItemActive : ''}`}
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

        <section className={layoutStyles.content}>
          <div className={layoutStyles.card}>
            <div className={styles.header}>
              <button
                className={styles.backBtn}
                onClick={() =>
                  navigate('/commerce/room-service', {
                    state: { selectedBuildingId, selectedBuildingNm },
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
              <div className={styles.buildingBadge}>
                🏢 {selectedBuildingNm} 배달
              </div>
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
                  onClick={() => navigate('/commerce/room-service')}
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
                      localQty={qtyMap[item.cartItemId] ?? item.orderQuantity}
                      stock={stockMap[item.prodId] ?? null}
                      applying={applyingId === item.cartItemId}
                      onSetQty={handleSetQty}
                      onApply={handleApply}
                      onRemove={handleRemove}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>

                <div className={styles.totalBox}>
                  <span className={styles.totalLabel}>
                    총 {localTotalQty}개
                  </span>
                  <span className={styles.totalAmt}>
                    {fmt(localTotalAmt)}원
                  </span>
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
        </section>
      </main>

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
      {/* ── 사전방문 팝업 ── */}
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
    </div>
  );
}
