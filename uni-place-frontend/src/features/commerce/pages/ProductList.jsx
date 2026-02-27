// src/features/commerce/pages/ProductList.jsx
//
// ✅ 수량은 로컬 pendingMap 에서만 관리 (API 연동 없음)
// ✅ "장바구니 담기" 버튼 클릭 시 일괄 API 호출
// ✅ blur 해도 입력값 유지 (0으로 리셋 안 됨)
// ✅ 재고 초과 방지: pendingQty + cartQty <= stock

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { buildingApi } from '../../../app/http/buildingApi';
import styles from './ProductList.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'kitchen', label: '주방' },
  { key: 'bathroom', label: '욕실' },
  { key: 'etc', label: '기타' },
];
const SIDE_MENUS = [
  { label: '내 정보', path: '/me' },
  { label: '마이룸', path: '/myroom' },
  { label: '작성 목록', path: '/my/posts' },
  { label: '공용 시설', path: '/me?tab=space' },
  { label: '사전 방문', path: '__TOUR_POPUP__' },
  { label: '룸서비스', path: '/commerce/room-service' },
];

function fmt(n) {
  return n == null ? '0' : Number(n).toLocaleString('ko-KR');
}

// ── 빌딩 선택 ──────────────────────────────────────────────────────────────
function BuildingSelector({ buildings, selectedId, onSelect, loading }) {
  if (loading) return <p className={styles.emptyMsg}>빌딩 목록 로딩 중…</p>;
  if (!buildings.length) return null;
  return (
    <div className={styles.buildingRow}>
      <span className={styles.buildingLabel}>🏢 배달 빌딩 선택</span>
      <div className={styles.buildingBtns}>
        {buildings.map((b) => (
          <button
            key={b.buildingId}
            className={`${styles.buildingBtn} ${selectedId === b.buildingId ? styles.buildingBtnActive : ''}`}
            onClick={() => onSelect(b.buildingId)}
          >
            {b.buildingNm}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 상품 카드 ──────────────────────────────────────────────────────────────
// pendingQty  : 이 상품의 로컬 수량 (아직 카트에 안 담긴 값)
// cartQty     : 현재 카트에 있는 수량
// stock       : 빌딩 재고
// onSetPending: (product, qty) => void
function ProductCard({
  product,
  pendingQty,
  cartQty,
  stock,
  noBuilding,
  onSetPending,
}) {
  const outOfStock = !noBuilding && stock === 0;
  const unavailable = !noBuilding && stock === null;
  const canInteract = !noBuilding && !unavailable && !outOfStock;

  // 이미 카트에 있는 양을 포함한 총 보유 예정 수량
  const totalQty = pendingQty + cartQty;
  // 재고 한도 (카트에 있는 것 포함해서 stock 이하)
  const maxAddable = stock != null ? Math.max(0, stock - cartQty) : 9999;
  const atMax = stock != null && totalQty >= stock;

  // 입력창 문자열 state (blur 해도 유지)
  const [inputStr, setInputStr] = useState(String(pendingQty));

  // pendingQty가 외부에서 바뀌면 동기화 (단, 포커스 중이면 유지)
  const isFocused = useRef(false);
  useEffect(() => {
    if (!isFocused.current) setInputStr(String(pendingQty));
  }, [pendingQty]);

  // 재고 라벨
  let stockLabel;
  if (noBuilding)
    stockLabel = (
      <span className={styles.stockNotice}>빌딩을 먼저 선택하세요</span>
    );
  else if (unavailable)
    stockLabel = (
      <span className={styles.stockUnavailable}>이 빌딩에서 판매 안 함</span>
    );
  else if (outOfStock)
    stockLabel = <span className={styles.stockOut}>품절</span>;
  else if (stock <= 5)
    stockLabel = <span className={styles.stockLow}>재고 {stock}개 남음</span>;
  else stockLabel = <span className={styles.stockOk}>재고 {stock}개</span>;

  const setPending = (v) => {
    const clamped = Math.max(0, Math.min(v, maxAddable));
    onSetPending(product, clamped);
    if (!isFocused.current) setInputStr(String(clamped));
  };

  const handleMinus = () => {
    if (pendingQty > 0) setPending(pendingQty - 1);
  };
  const handlePlus = () => {
    if (!canInteract) {
      if (noBuilding) alert('먼저 빌딩을 선택해주세요.');
      return;
    }
    if (atMax) {
      alert(`재고가 부족합니다. (최대 ${maxAddable}개 추가 가능)`);
      return;
    }
    setPending(pendingQty + 1);
  };

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setInputStr(raw); // 타이핑 중엔 그냥 표시
  };

  const handleInputBlur = () => {
    isFocused.current = false;
    // blur 시 값 보정만 하고, 0으로 리셋하지 않음
    const parsed = inputStr === '' ? 0 : parseInt(inputStr, 10);
    const clamped = Math.max(0, Math.min(parsed, maxAddable));
    setInputStr(String(clamped));
    if (clamped !== pendingQty) onSetPending(product, clamped);
  };

  return (
    <div
      className={`${styles.card} ${pendingQty > 0 || cartQty > 0 ? styles.cardActive : ''} ${outOfStock || unavailable ? styles.cardDim : ''}`}
    >
      {/* 카트에 이미 담긴 수량 뱃지 */}
      {cartQty > 0 && <div className={styles.cardBadge}>{cartQty}</div>}

      <div className={styles.cardImg}>
        <span className={styles.cardImgLabel}>품목사진</span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{product.prodNm}</span>
          <span className={styles.cardPrice}>{fmt(product.prodPrice)}원</span>
        </div>
        {product.prodDesc && (
          <p className={styles.cardDesc}>{product.prodDesc}</p>
        )}
        <div className={styles.stockRow}>{stockLabel}</div>

        {/* 카트에 이미 있을 경우 안내 */}
        {cartQty > 0 && (
          <p className={styles.cartQtyNotice}>장바구니에 {cartQty}개 담김</p>
        )}

        <div className={styles.qtyRow}>
          <div className={styles.qtyControl}>
            {/* − */}
            <button
              className={`${styles.qtyBtn} ${pendingQty === 0 ? styles.qtyBtnDisabled : ''}`}
              onClick={handleMinus}
              disabled={pendingQty === 0}
              aria-label="수량 감소"
            >
              −
            </button>

            {/* 숫자 입력 */}
            <input
              className={styles.qtyInput}
              type="text"
              inputMode="numeric"
              value={isFocused.current ? inputStr : String(pendingQty)}
              onChange={handleInputChange}
              onFocus={() => {
                isFocused.current = true;
                setInputStr(String(pendingQty));
              }}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
              }}
              disabled={!canInteract}
              aria-label="수량"
            />

            {/* + */}
            <button
              className={`${styles.qtyBtn} ${atMax || !canInteract ? styles.qtyBtnDisabled : ''}`}
              onClick={handlePlus}
              disabled={atMax || !canInteract}
              aria-label="수량 증가"
            >
              +
            </button>

            {pendingQty > 0 && (
              <span className={styles.qtyPrice}>
                {fmt(product.prodPrice * pendingQty)}원
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────
export default function ProductList() {
  const navigate = useNavigate();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);
  const location = useLocation();

  const { products, loading: prodLoading, error: prodError } = useProducts();
  const {
    cart,
    addItem,
    updateItem,
    clear: clearCart,
    actionLoading,
    refetch: refetchCart,
  } = useCart();

  const [activeTab, setActiveTab] = useState('all');
  const [buildings, setBuildings] = useState([]);
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(
    location.state?.selectedBuildingId ?? null
  );

  // ── 로컬 수량 맵: prodId → pendingQty (아직 API 안 보낸 수량) ──────
  const [pendingMap, setPendingMap] = useState({});
  const [adding, setAdding] = useState(false); // 담기 버튼 로딩

  // 빌딩 목록 로드
  useEffect(() => {
    setBuildingLoading(true);
    buildingApi
      .getList({ size: 50 })
      .then((res) => {
        const list =
          res?.data?.data?.content ??
          res?.data?.data ??
          res?.data?.content ??
          res?.data ??
          [];
        setBuildings(Array.isArray(list) ? list : []);
      })
      .catch(() => setBuildings([]))
      .finally(() => setBuildingLoading(false));
  }, []);

  // 빌딩 바뀌면 pending 초기화
  const handleSelectBuilding = async (id) => {
    if (id === selectedBuildingId) return;
    const cartItems = cart?.items ?? [];
    if (cartItems.length > 0) {
      const confirmed = window.confirm(
        '빌딩을 변경하면 장바구니가 초기화됩니다.\n계속하시겠습니까?'
      );
      if (!confirmed) return;
      try {
        await clearCart();
      } catch (e) {
        alert('장바구니 초기화에 실패했습니다.');
        return;
      }
    }
    setSelectedBuildingId(id);
    setPendingMap({});
  };

  // 카트 맵: prodId_buildingId → cartItem
  const cartMap = useMemo(() => {
    const m = {};
    (cart?.items ?? []).forEach((i) => {
      m[`${i.prodId}_${i.buildingId}`] = i;
    });
    return m;
  }, [cart]);

  // 수량 변경 (로컬만)
  const handleSetPending = useCallback((product, qty) => {
    setPendingMap((prev) => ({ ...prev, [product.prodId]: qty }));
  }, []);

  // ── 장바구니 담기 ─────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!selectedBuildingId) {
      alert('빌딩을 선택해주세요.');
      return;
    }

    const toAdd = products.filter((p) => (pendingMap[p.prodId] ?? 0) > 0);
    if (!toAdd.length) {
      alert('수량을 1개 이상 입력해주세요.');
      return;
    }

    // ── 한 빌딩만 담기 제한 ──────────────────────────────────────────────
    // 카트에 이미 다른 빌딩의 상품이 있으면 경고 후 차단
    const cartItems = cart?.items ?? [];
    if (cartItems.length > 0) {
      const cartBuildingId = cartItems[0]?.buildingId;
      if (
        cartBuildingId &&
        String(cartBuildingId) !== String(selectedBuildingId)
      ) {
        const cartBuilding = buildings.find(
          (b) => String(b.buildingId) === String(cartBuildingId)
        );
        const cartBuildingNm =
          cartBuilding?.buildingNm ?? `빌딩 #${cartBuildingId}`;
        const selectedBuildingNm =
          buildings.find((b) => b.buildingId === selectedBuildingId)
            ?.buildingNm ?? '';
        const confirmed = window.confirm(
          `장바구니에 이미 [${cartBuildingNm}]의 상품이 담겨있습니다.\n[${selectedBuildingNm}] 상품을 담으려면 기존 장바구니를 비워야 합니다.\n\n장바구니를 비우고 새로 담을까요?`
        );
        if (!confirmed) return;
        // 기존 카트 비우기
        try {
          await clearCart();
        } catch (e) {
          alert('장바구니 비우기에 실패했습니다.');
          return;
        }
      }
    }

    // 교체
    // 최신 카트 데이터로 재고 검증
    const freshCart = await refetchCart();
    const freshCartMap = {};
    ((freshCart ?? cart)?.items ?? []).forEach((i) => {
      freshCartMap[`${i.prodId}_${i.buildingId}`] = i;
    });

    for (const p of toAdd) {
      const pending = pendingMap[p.prodId] ?? 0;
      const cartQty =
        freshCartMap[`${p.prodId}_${selectedBuildingId}`]?.orderQuantity ?? 0;
      const stock =
        p.buildingStocks?.[Number(selectedBuildingId)] ??
        p.buildingStocks?.[selectedBuildingId] ??
        null;
      if (stock !== null && pending + cartQty > stock) {
        alert(
          `[${p.prodNm}] 재고 초과입니다.\n현재 카트: ${cartQty}개, 추가 요청: ${pending}개, 재고: ${stock}개`
        );
        return;
      }
    }

    setAdding(true);
    try {
      for (const p of toAdd) {
        const pending = pendingMap[p.prodId] ?? 0;
        const key = `${p.prodId}_${selectedBuildingId}`;
        const ci = cartMap[key];
        if (ci) {
          await updateItem(ci.cartItemId, {
            quantity: ci.orderQuantity + pending,
          });
        } else {
          await addItem({
            prodId: p.prodId,
            buildingId: selectedBuildingId,
            quantity: pending,
          });
        }
      }
      // 담기 성공 → pending 초기화
      setPendingMap({});
      alert('장바구니에 담았습니다! 🛒');
    } catch (e) {
      alert(e.message || '장바구니 담기에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  // ── 집계 ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeTab === 'all') return products;
    return products.filter(
      (p) => String(p.code ?? '').toLowerCase() === activeTab
    );
  }, [products, activeTab]);

  // pending 합계 (담기 버튼 활성화용)
  const pendingTotal = useMemo(
    () => Object.values(pendingMap).reduce((s, v) => s + (v || 0), 0),
    [pendingMap]
  );

  // 하단 바 — 카트에 담긴 것 기준
  const cartItems = useMemo(() => cart?.items ?? [], [cart]);
  const cartTotalQty = cart?.totalQuantity ?? 0;
  const cartTotalAmt = cart?.totalAmount ?? 0;

  const summaryText = useMemo(() => {
    if (!cartItems.length) return null;
    const preview = cartItems
      .slice(0, 2)
      .map((i) => `${i.prodNm} ×${i.orderQuantity}`)
      .join('  ·  ');
    return cartItems.length > 2 ? preview + '  ·  …' : preview;
  }, [cartItems]);

  const selectedBuilding = buildings.find(
    (b) => b.buildingId === selectedBuildingId
  );
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
            <div className={styles.topTabs}>
              <button className={`${styles.topTab} ${styles.topTabActive}`}>
                주문
              </button>
              <button
                className={styles.topTab}
                onClick={() => navigate('/commerce/orders')}
              >
                주문 내역
              </button>
            </div>

            <div className={styles.panel}>
              <BuildingSelector
                buildings={buildings}
                selectedId={selectedBuildingId}
                onSelect={handleSelectBuilding}
                loading={buildingLoading}
              />

              <div className={styles.catTabs}>
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`${styles.catTab} ${activeTab === t.key ? styles.catTabActive : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={styles.list}>
                {prodLoading && (
                  <div className={styles.center}>
                    <span className={styles.spin} />
                  </div>
                )}
                {prodError && <p className={styles.errMsg}>{prodError}</p>}
                {!prodLoading && !prodError && filtered.length === 0 && (
                  <p className={styles.emptyMsg}>상품이 없습니다.</p>
                )}
                {filtered.map((p) => {
                  const stock =
                    selectedBuildingId != null && p.buildingStocks
                      ? (p.buildingStocks[Number(selectedBuildingId)] ??
                        p.buildingStocks[selectedBuildingId] ??
                        null)
                      : null;
                  const cartQty =
                    cartMap[`${p.prodId}_${selectedBuildingId}`]
                      ?.orderQuantity ?? 0;
                  const pendingQty = pendingMap[p.prodId] ?? 0;
                  return (
                    <ProductCard
                      key={p.prodId}
                      product={p}
                      pendingQty={pendingQty}
                      cartQty={cartQty}
                      stock={stock}
                      noBuilding={selectedBuildingId == null}
                      onSetPending={handleSetPending}
                    />
                  );
                })}
              </div>

              {/* ── 하단 바 ── */}
              <div className={styles.bottomBar}>
                {/* 왼쪽: 카트 현황 */}
                <div className={styles.barSummary}>
                  {summaryText ? (
                    <>
                      <span className={styles.barText}>{summaryText}</span>
                      <span className={styles.barTotal}>
                        {fmt(cartTotalAmt)}원
                      </span>
                    </>
                  ) : (
                    <span className={styles.barEmpty}>
                      장바구니가 비어 있습니다
                    </span>
                  )}
                </div>

                <div className={styles.barActions}>
                  {/* 장바구니 담기 */}
                  <button
                    className={`${styles.addCartBtn} ${pendingTotal === 0 ? styles.addCartBtnDim : ''}`}
                    onClick={handleAddToCart}
                    disabled={adding || actionLoading || pendingTotal === 0}
                  >
                    {adding
                      ? '담는 중…'
                      : `장바구니 담기${pendingTotal > 0 ? ` (${pendingTotal}개)` : ''}`}
                  </button>

                  {/* 장바구니 보기 */}
                  {cartTotalQty > 0 && (
                    <button
                      className={styles.goCartBtn}
                      onClick={() => {
                        if (!selectedBuildingId) {
                          alert('빌딩을 선택해주세요.');
                          return;
                        }
                        navigate('/commerce/cart', {
                          state: {
                            selectedBuildingId,
                            selectedBuildingNm:
                              selectedBuilding?.buildingNm ?? '',
                          },
                        });
                      }}
                    >
                      장바구니 보기
                      <span className={styles.badge}>{cartTotalQty}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
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
