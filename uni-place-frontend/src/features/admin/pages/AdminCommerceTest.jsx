// src/features/admin/pages/AdminCommerceTest.jsx
// ⚠️ 임시 테스트 페이지 — API 연결 확인 후 삭제할 것
//
// 확인 항목:
// 1. 상품 목록 조회 (공개 GET /products)
// 2. 관리자 전체 주문 목록 (GET /admin/orders)
// 3. 관리자 룸서비스 주문 목록 (GET /admin/room-services)

import { useState } from 'react';
import { useAdminProductList } from '../hooks/useAdminProducts';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useAdminRoomServiceOrders } from '../hooks/useAdminRoomServiceOrders';
import { adminApi } from '../api/adminApi';

// ── 공통 스타일 (인라인 — 임시 페이지라 CSS 파일 없음) ──
const s = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '32px 24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: '#0B0E12',
  },
  sub: {
    fontSize: 13,
    color: '#48535F',
    marginBottom: 32,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 4,
    color: '#0B0E12',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  endpoint: {
    fontSize: 11,
    color: '#9A8C70',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statusRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  badge: (type) => ({
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background:
      type === 'ok'
        ? '#d1fae5'
        : type === 'error'
          ? '#fee2e2'
          : type === 'loading'
            ? '#fef3c7'
            : '#e5e7eb',
    color:
      type === 'ok'
        ? '#065f46'
        : type === 'error'
          ? '#991b1b'
          : type === 'loading'
            ? '#92400e'
            : '#374151',
  }),
  count: {
    fontSize: 13,
    color: '#48535F',
  },
  pre: {
    background: '#f8f8f8',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    maxHeight: 220,
    overflowY: 'auto',
    color: '#1a1a1a',
    margin: 0,
  },
  errorBox: {
    background: '#fee2e2',
    border: '1px solid #fca5a5',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: '#991b1b',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  btn: {
    marginTop: 12,
    padding: '7px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#D9AD5B',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  divider: {
    borderTop: '1px solid #f0f0f0',
    margin: '12px 0',
  },
  paginInfo: {
    fontSize: 12,
    color: '#9A8C70',
    marginTop: 8,
  },
};

// ── 상태 뱃지 ──
function StatusBadge({ loading, error, data }) {
  if (loading) return <span style={s.badge('loading')}>로딩 중…</span>;
  if (error) return <span style={s.badge('error')}>에러</span>;
  if (data !== null && data !== undefined)
    return <span style={s.badge('ok')}>✓ 성공</span>;
  return <span style={s.badge('idle')}>대기</span>;
}

// ── 1. 상품 목록 카드 ──
function ProductCard() {
  const { products, loading, error, refetch } = useAdminProductList();

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        🛍️ 상품 목록
        <StatusBadge loading={loading} error={error} data={products} />
      </div>
      <div style={s.endpoint}>GET /products (공개 API — on_sale 상태만)</div>

      <div style={s.statusRow}>
        <span style={s.count}>
          {loading ? '조회 중…' : `총 ${products.length}개`}
        </span>
      </div>

      {error && <div style={s.errorBox}>❌ {error}</div>}

      {!loading && !error && (
        <pre style={s.pre}>
          {products.length > 0
            ? JSON.stringify(products.slice(0, 3), null, 2) +
              (products.length > 3 ? `\n... 외 ${products.length - 3}개` : '')
            : '데이터 없음'}
        </pre>
      )}

      <button style={s.btn} onClick={refetch} disabled={loading}>
        {loading ? '로딩 중…' : '다시 조회'}
      </button>
    </div>
  );
}

// ── 2. 관리자 주문 목록 카드 ──
function OrderCard() {
  const { orders, pagination, loading, error, refetch, goToPage } =
    useAdminOrders({ size: 5 });

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        📦 전체 주문 목록
        <StatusBadge loading={loading} error={error} data={orders} />
      </div>
      <div style={s.endpoint}>GET /admin/orders (관리자 전용)</div>

      <div style={s.statusRow}>
        <span style={s.count}>
          {loading
            ? '조회 중…'
            : `총 ${pagination.totalElements}개 / ${pagination.totalPages}페이지`}
        </span>
      </div>

      {error && <div style={s.errorBox}>❌ {error}</div>}

      {!loading && !error && (
        <>
          <pre style={s.pre}>
            {orders.length > 0
              ? JSON.stringify(orders.slice(0, 2), null, 2) +
                (orders.length > 2 ? `\n... 외 ${orders.length - 2}개` : '')
              : '데이터 없음'}
          </pre>
          <div style={s.paginInfo}>
            현재 {pagination.currentPage} / {pagination.totalPages} 페이지
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          style={{ ...s.btn, background: '#9A8C70' }}
          onClick={() => goToPage(Math.max(1, pagination.currentPage - 1))}
          disabled={loading || pagination.currentPage <= 1}
        >
          이전
        </button>
        <button style={s.btn} onClick={refetch} disabled={loading}>
          새로고침
        </button>
        <button
          style={{ ...s.btn, background: '#9A8C70' }}
          onClick={() =>
            goToPage(
              Math.min(pagination.totalPages, pagination.currentPage + 1)
            )
          }
          disabled={loading || pagination.currentPage >= pagination.totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}

// ── 3. 룸서비스 주문 목록 카드 ──
function RoomServiceCard() {
  const { orders, pagination, loading, error, refetch } =
    useAdminRoomServiceOrders({ size: 5 });

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        🛎️ 룸서비스 주문 목록
        <StatusBadge loading={loading} error={error} data={orders} />
      </div>
      <div style={s.endpoint}>GET /admin/room-services (관리자 전용)</div>

      <div style={s.statusRow}>
        <span style={s.count}>
          {loading
            ? '조회 중…'
            : `총 ${pagination.totalElements}개 / ${pagination.totalPages}페이지`}
        </span>
      </div>

      {error && <div style={s.errorBox}>❌ {error}</div>}

      {!loading && !error && (
        <>
          <pre style={s.pre}>
            {orders.length > 0
              ? JSON.stringify(orders.slice(0, 2), null, 2) +
                (orders.length > 2 ? `\n... 외 ${orders.length - 2}개` : '')
              : '데이터 없음'}
          </pre>
          <div style={s.paginInfo}>
            현재 {pagination.currentPage} / {pagination.totalPages} 페이지
          </div>
        </>
      )}

      <button style={s.btn} onClick={refetch} disabled={loading}>
        {loading ? '로딩 중…' : '다시 조회'}
      </button>
    </div>
  );
}

// ── 4. 상품 생성 테스트 카드 ──
function ProductCreateCard() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: 'TEST-001', // ✅ 이 줄 추가
    prodNm: '테스트 상품',
    prodPrice: 9900,
    prodStock: 10,
    prodDesc: '테스트용 상품입니다.',
  });

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const prodId = await adminApi.createProduct(form);
      setResult({ prodId, message: '상품 생성 성공!' });
    } catch (err) {
      setError(err?.message || '상품 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 6,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        ➕ 상품 생성 테스트
        <StatusBadge loading={loading} error={error} data={result} />
      </div>
      <div style={s.endpoint}>POST /admin/products</div>
      <div style={s.divider} />

      <input
        style={inputStyle}
        value={form.code}
        onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
        placeholder="상품 코드"
      />
      <input
        style={inputStyle}
        value={form.prodNm}
        onChange={(e) => setForm((p) => ({ ...p, prodNm: e.target.value }))}
        placeholder="상품명"
      />
      <input
        style={inputStyle}
        type="number"
        value={form.prodPrice}
        onChange={(e) =>
          setForm((p) => ({ ...p, prodPrice: Number(e.target.value) }))
        }
        placeholder="가격"
      />
      <input
        style={inputStyle}
        type="number"
        value={form.prodStock}
        onChange={(e) =>
          setForm((p) => ({ ...p, prodStock: Number(e.target.value) }))
        }
        placeholder="재고"
      />

      {error && (
        <div style={{ ...s.errorBox, marginBottom: 8 }}>❌ {error}</div>
      )}
      {result && (
        <pre style={{ ...s.pre, marginBottom: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      <button style={s.btn} onClick={handleCreate} disabled={loading}>
        {loading ? '생성 중…' : '상품 생성 실행'}
      </button>
    </div>
  );
}

// ── 메인 테스트 페이지 ──
export default function AdminCommerceTest() {
  return (
    <div style={s.page}>
      <h1 style={s.heading}>🔧 Admin Commerce API 테스트</h1>
      <p style={s.sub}>
        ⚠️ 임시 페이지입니다 — API 연결 확인 후 삭제하세요. &nbsp;|&nbsp; 경로:
        /admin/commerce/test
      </p>

      <div style={s.grid}>
        <ProductCard />
        <OrderCard />
        <RoomServiceCard />
        <ProductCreateCard />
      </div>
    </div>
  );
}
