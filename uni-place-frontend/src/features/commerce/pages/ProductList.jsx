// src/features/commerce/pages/ProductList.jsx
// inlineMode: MemberInfo 탭 내에서 사용 시 true (navigate 대신 onNav 콜백)

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
import { useTenantContract } from '../hooks/useTenantContract';

import { withApiPrefix } from '../../../app/http/apiBase';
import { toApiImageUrl } from '../../file/api/fileApi';
import styles from './ProductList.module.css';
import layoutStyles from '../../user/pages/MemberInfo.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

// PRODUCT_CATEGORY 그룹의 공통코드를 조회해 code → codeValue 매핑 반환
async function fetchProductCategoryCodes() {
  try {
    const res = await fetch(
      withApiPrefix('/admin/common-codes/PRODUCT_CATEGORY')
    );
    if (!res.ok) return {};
    const json = await res.json();
    const list = json?.data ?? [];
    return Object.fromEntries(list.map((c) => [c.code, c.codeValue]));
  } catch {
    return {};
  }
}

function fmt(n) {
  return n == null ? '0' : Number(n).toLocaleString('ko-KR');
}

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

function ProductCard({
  product,
  codeLabel,
  pendingQty,
  cartQty,
  stock,
  noBuilding,
  onSetPending,
}) {
  const outOfStock = !noBuilding && stock === 0;
  const unavailable = !noBuilding && stock === null;
  const canInteract = !noBuilding && !unavailable && !outOfStock;
  const totalQty = pendingQty + cartQty;
  const maxAddable = stock != null ? Math.max(0, stock - cartQty) : 9999;
  const atMax = stock != null && totalQty >= stock;
  const [inputStr, setInputStr] = useState(String(pendingQty));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setInputStr(String(pendingQty));
  }, [pendingQty]);

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
  else if (stock <= 3)
    stockLabel = <span className={styles.stockLow}>재고 {stock}개 남음</span>;
  else stockLabel = <span className={styles.stockOk}>재고 {stock}개</span>;

  const setPending = (v) => {
    const clamped = Math.max(0, Math.min(v, maxAddable));
    onSetPending(product, clamped);
    if (!isFocused.current) setInputStr(String(clamped));
  };

  return (
    <div
      className={`${styles.card} ${pendingQty > 0 || cartQty > 0 ? styles.cardActive : ''} ${outOfStock || unavailable ? styles.cardDim : ''}`}
    >
      <div className={styles.cardImg}>
        {product.images && product.images.length > 0 ? (
          <img
            src={(() => {
              const u = product.images[0].viewUrl || '';
              return toApiImageUrl(u);
            })()}
            alt={product.prodNm}
            className={styles.cardImgPhoto}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className={styles.cardImgLabel}
          style={{
            display:
              product.images && product.images.length > 0 ? 'none' : 'flex',
          }}
        >
          품목사진
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{product.prodNm}</span>
          <span className={styles.cardPrice}>{fmt(product.prodPrice)}원</span>
        </div>
        {codeLabel && <span className={styles.codeBadge}>{codeLabel}</span>}
        {product.prodDesc && (
          <p className={styles.cardDesc}>{product.prodDesc}</p>
        )}
        <div className={styles.stockRow}>{stockLabel}</div>
        <div className={styles.qtyRow}>
          <div className={styles.qtyControl}>
            <button
              className={`${styles.qtyBtn} ${atMax || !canInteract ? styles.qtyBtnDisabled : ''}`}
              onClick={() => {
                if (!canInteract) {
                  if (noBuilding) alert('먼저 빌딩을 선택해주세요.');
                  return;
                }
                if (atMax) {
                  alert(`재고가 부족합니다. (최대 ${maxAddable}개 추가 가능)`);
                  return;
                }
                setPending(pendingQty + 1);
              }}
              disabled={atMax || !canInteract}
            >
              +
            </button>
            <input
              className={styles.qtyInput}
              type="text"
              inputMode="numeric"
              value={isFocused.current ? inputStr : String(pendingQty)}
              onChange={(e) =>
                setInputStr(e.target.value.replace(/[^0-9]/g, ''))
              }
              onFocus={() => {
                isFocused.current = true;
                setInputStr(String(pendingQty));
              }}
              onBlur={() => {
                isFocused.current = false;
                const parsed = inputStr === '' ? 0 : parseInt(inputStr, 10);
                const clamped = Math.max(0, Math.min(parsed, maxAddable));
                setInputStr(String(clamped));
                if (clamped !== pendingQty) onSetPending(product, clamped);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
              }}
              disabled={!canInteract}
            />
            <button
              className={`${styles.qtyBtn} ${pendingQty === 0 ? styles.qtyBtnDisabled : ''}`}
              onClick={() => pendingQty > 0 && setPending(pendingQty - 1)}
              disabled={pendingQty === 0}
            >
              −
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

// inlineMode=true 이면 navigate 없이 onNav(view, state) 콜백 사용
export default function ProductList({
  inlineMode = false,
  onNav,
  initialBuildingId,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const go = (path, state) => {
    if (inlineMode && onNav) onNav(path, state);
    else navigate(path, state ? { state } : undefined);
  };

  const { products, loading: prodLoading, error: prodError } = useProducts();
  const {
    cart,
    addItem,
    updateItem,
    clear: clearCart,
    actionLoading,
    refetch: refetchCart,
  } = useCart();
  const {
    contracts: tenantContracts,
    loading: tenantLoading,
    error: tenantError,
  } = useTenantContract();

  const [activeTab, setActiveTab] = useState('all');
  const [prodPage, setProdPage] = useState(1);
  const PAGE_SIZE = 3;
  // 동적 카테고리 탭: products의 code + 공통코드 API codeValue로 생성
  const [tabs, setTabs] = useState([{ key: 'all', label: '전체' }]);
  const [codeValueMap, setCodeValueMap] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(
    initialBuildingId ??
      (inlineMode ? null : (location.state?.selectedBuildingId ?? null))
  );
  const [pendingMap, setPendingMap] = useState({});
  const [adding, setAdding] = useState(false);

  // products 로드 완료 시 → 공통코드 API로 codeValue 조회 후 탭 동적 생성
  useEffect(() => {
    if (!products.length) return;

    // products에서 중복 없는 code 목록 추출
    const uniqueCodes = [
      ...new Set(products.map((p) => p.code).filter(Boolean)),
    ];

    fetchProductCategoryCodes().then((codeValueMap) => {
      setCodeValueMap(codeValueMap);
      const dynamicTabs = uniqueCodes.map((code) => ({
        key: code,
        label: codeValueMap[code] ?? code,
      }));
      setTabs([{ key: 'all', label: '전체' }, ...dynamicTabs]);
    });
  }, [products]);

  useEffect(() => {
    setBuildingLoading(tenantLoading);
    if (tenantLoading) return;

    if (!tenantContracts.length) {
      setBuildings([]);
      setSelectedBuildingId(null);
      return;
    }

    const uniqMap = new Map();
    tenantContracts.forEach((c) => {
      if (!c?.buildingId) return;
      if (!uniqMap.has(c.buildingId)) {
        uniqMap.set(c.buildingId, {
          buildingId: c.buildingId,
          buildingNm: c.buildingNm ?? `빌딩 #${c.buildingId}`,
        });
      }
    });
    const nextBuildings = Array.from(uniqMap.values());
    setBuildings(nextBuildings);
    setSelectedBuildingId((prev) => {
      if (prev && nextBuildings.some((b) => b.buildingId === prev)) return prev;
      if (
        initialBuildingId &&
        nextBuildings.some((b) => b.buildingId === initialBuildingId)
      ) {
        return initialBuildingId;
      }
      return nextBuildings[0]?.buildingId ?? null;
    });
  }, [tenantContracts, tenantLoading, initialBuildingId]);

  const handleSelectBuilding = async (id) => {
    if (id === selectedBuildingId) return;
    const cartItems = cart?.items ?? [];
    if (cartItems.length > 0) {
      if (
        !window.confirm(
          '빌딩을 변경하면 장바구니가 초기화됩니다.\n계속하시겠습니까?'
        )
      )
        return;
      try {
        await clearCart();
      } catch {
        alert('장바구니 초기화에 실패했습니다.');
        return;
      }
    }
    setSelectedBuildingId(id);
    setPendingMap({});
  };

  const cartMap = useMemo(() => {
    const m = {};
    (cart?.items ?? []).forEach((i) => {
      m[`${i.prodId}_${i.buildingId}`] = i;
    });
    return m;
  }, [cart]);

  const handleSetPending = useCallback((product, qty) => {
    setPendingMap((prev) => ({ ...prev, [product.prodId]: qty }));
  }, []);

  const handleAddToCart = async () => {
    if (!tenantContracts.length) {
      alert(
        tenantError || '현재 입주 중인 계약이 없어 룸서비스 주문이 불가합니다.'
      );
      return;
    }
    if (!selectedBuildingId) {
      alert('빌딩을 선택해주세요.');
      return;
    }
    const toAdd = products.filter((p) => (pendingMap[p.prodId] ?? 0) > 0);
    if (!toAdd.length) {
      alert('수량을 1개 이상 입력해주세요.');
      return;
    }

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
        if (
          !window.confirm(
            `장바구니에 이미 [${cartBuildingNm}]의 상품이 담겨있습니다.\n[${selectedBuildingNm}] 상품을 담으려면 기존 장바구니를 비워야 합니다.\n\n장바구니를 비우고 새로 담을까요?`
          )
        )
          return;
        try {
          await clearCart();
        } catch {
          alert('장바구니 비우기에 실패했습니다.');
          return;
        }
      }
    }

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
        if (ci)
          await updateItem(ci.cartItemId, {
            quantity: ci.orderQuantity + pending,
          });
        else
          await addItem({
            prodId: p.prodId,
            buildingId: selectedBuildingId,
            quantity: pending,
          });
      }
      setPendingMap({});
      alert('장바구니에 담았습니다! 🛒');
    } catch (e) {
      alert(e.message || '장바구니 담기에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const filtered = useMemo(() => {
    const list = activeTab === 'all' ? products : products.filter((p) => p.code === activeTab);
    if (selectedBuildingId == null) return list;
    // 재고 있는 상품 앞, 없는 상품 뒤로 정렬
    return [...list].sort((a, b) => {
      const sa = a.buildingStocks?.[Number(selectedBuildingId)] ?? a.buildingStocks?.[selectedBuildingId] ?? -1;
      const sb = b.buildingStocks?.[Number(selectedBuildingId)] ?? b.buildingStocks?.[selectedBuildingId] ?? -1;
      // 재고 있음(>0) > 품절(0) > 미판매(-1)
      if (sa > 0 && sb <= 0) return -1;
      if (sb > 0 && sa <= 0) return 1;
      return sb - sa; // 재고 많은 순
    });
  }, [products, activeTab, selectedBuildingId]);

  const pendingTotal = useMemo(
    () => Object.values(pendingMap).reduce((s, v) => s + (v || 0), 0),
    [pendingMap]
  );
  const cartItems = useMemo(() => cart?.items ?? [], [cart]);
  const cartTotalQty = cart?.totalQuantity ?? 0;
  const cartTotalAmt = cart?.totalAmount ?? 0;
  const selectedBuilding = buildings.find(
    (b) => b.buildingId === selectedBuildingId
  );

  const summaryText = useMemo(() => {
    if (!cartItems.length) return null;
    const preview = cartItems
      .slice(0, 2)
      .map((i) => `${i.prodNm} ×${i.orderQuantity}`)
      .join('  ·  ');
    return cartItems.length > 2 ? preview + '  ·  …' : preview;
  }, [cartItems]);

  const inner = (
    <div className={styles.root}>
      <div className={styles.topTabs}>
        <button className={`${styles.topTab} ${styles.topTabActive}`}>
          주문
        </button>
        <button
          className={styles.topTab}
          onClick={() => go('/commerce/orders')}
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
        {!tenantLoading && !tenantContracts.length && (
          <p className={styles.errMsg}>
            {tenantError ||
              '현재 입주 중인 계약이 없어 룸서비스 주문이 불가합니다.'}
          </p>
        )}
        <div className={styles.catTabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.catTab} ${activeTab === t.key ? styles.catTabActive : ''}`}
              onClick={() => {
                setActiveTab(t.key);
                setProdPage(1);
              }}
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
          {filtered
            .slice((prodPage - 1) * PAGE_SIZE, prodPage * PAGE_SIZE)
            .map((p) => {
              const stock =
                selectedBuildingId != null && p.buildingStocks
                  ? (p.buildingStocks[Number(selectedBuildingId)] ??
                    p.buildingStocks[selectedBuildingId] ??
                    null)
                  : null;
              const cartQty =
                cartMap[`${p.prodId}_${selectedBuildingId}`]?.orderQuantity ??
                0;
              return (
                <ProductCard
                  key={p.prodId}
                  product={p}
                  codeLabel={codeValueMap[p.code] ?? null}
                  pendingQty={pendingMap[p.prodId] ?? 0}
                  cartQty={cartQty}
                  stock={stock}
                  noBuilding={selectedBuildingId == null}
                  onSetPending={handleSetPending}
                />
              );
            })}
        </div>
        {/* ── 페이지네이션 ── */}
        {!prodLoading && !prodError && filtered.length > PAGE_SIZE && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={prodPage <= 1}
              onClick={() => setProdPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from(
              { length: Math.ceil(filtered.length / PAGE_SIZE) },
              (_, i) => i + 1
            ).map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.pageBtn} ${n === prodPage ? styles.pageBtnActive : ''}`}
                onClick={() => setProdPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={prodPage >= Math.ceil(filtered.length / PAGE_SIZE)}
              onClick={() => setProdPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        )}
        <div className={styles.bottomBar}>
          <div className={styles.barSummary}>
            {summaryText ? (
              <>
                <span className={styles.barText}>{summaryText}</span>
                <span className={styles.barTotal}>{fmt(cartTotalAmt)}원</span>
              </>
            ) : (
              <span className={styles.barEmpty}>장바구니가 비어 있습니다</span>
            )}
          </div>
          <div className={styles.barActions}>
            <button
              className={`${styles.addCartBtn} ${pendingTotal === 0 ? styles.addCartBtnDim : ''}`}
              onClick={handleAddToCart}
              disabled={
                adding ||
                actionLoading ||
                pendingTotal === 0 ||
                !tenantContracts.length
              }
            >
              {adding
                ? '담는 중…'
                : `장바구니 담기${pendingTotal > 0 ? ` (${pendingTotal}개)` : ''}`}
            </button>
            {cartTotalQty > 0 && (
              <button
                className={styles.goCartBtn}
                onClick={() => {
                  if (!tenantContracts.length) {
                    alert(
                      tenantError ||
                        '현재 입주 중인 계약이 없어 룸서비스 주문이 불가합니다.'
                    );
                    return;
                  }
                  if (!selectedBuildingId) {
                    alert('빌딩을 선택해주세요.');
                    return;
                  }
                  go('/commerce/cart', {
                    selectedBuildingId,
                    selectedBuildingNm: selectedBuilding?.buildingNm ?? '',
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
  );

  const modals = (
    <>
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
                className={`${layoutStyles.sideItem} ${location.pathname + location.search === m.path ? layoutStyles.sideItemActive : ''}`}
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
