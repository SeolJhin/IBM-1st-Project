import React, { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAdminProductList } from '../../hooks/useAdminProducts';
import styles from './AdminProductList.module.css';

const STATUS_OPTIONS = [
  { value: 'on_sale', label: '판매중' },
  { value: 'sold_out', label: '품절' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function formatMoney(value) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')}원`;
}

function windowedPages(currentPage, totalPages, radius = 2) {
  const pages = [];
  const from = Math.max(1, currentPage - radius);
  const to = Math.min(totalPages, currentPage + radius);
  for (let page = from; page <= to; page += 1) pages.push(page);
  return pages;
}

function StatusBadge({ status }) {
  const key = String(status ?? '').toLowerCase();
  return (
    <span
      className={`${styles.badge} ${key === 'sold_out' ? styles.badgeSoldOut : styles.badgeOnSale}`}
    >
      {STATUS_LABELS[key] ?? status ?? '-'}
    </span>
  );
}

function toStockEntries(map) {
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map)
    .map(([buildingId, stock]) => ({
      buildingId: Number(buildingId),
      stock: Number(stock ?? 0),
    }))
    .sort((a, b) => a.buildingId - b.buildingId);
}

export default function AdminProductList() {
  const { products, loading, error, refetch } = useAdminProductList();

  const [statusFilter, setStatusFilter] = useState('all');
  const [codeFilter, setCodeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const [editableStatus, setEditableStatus] = useState({});
  const [savingProdId, setSavingProdId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const next = {};
    products.forEach((product) => {
      next[product.prodId] = product.prodSt ?? 'on_sale';
    });
    setEditableStatus(next);
  }, [products]);

  const codeOptions = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      const code = String(product.code ?? '').trim();
      if (code) set.add(code);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return [...products]
      .sort((a, b) => Number(b.prodId ?? 0) - Number(a.prodId ?? 0))
      .filter((product) => {
        if (statusFilter !== 'all' && product.prodSt !== statusFilter) return false;
        if (codeFilter !== 'all' && String(product.code ?? '') !== codeFilter) {
          return false;
        }
        if (!query) return true;

        const haystack = [
          product.prodId,
          product.prodNm,
          product.prodDesc,
          product.code,
          product.affiliateId,
        ]
          .map((item) => String(item ?? '').toLowerCase())
          .join(' ');

        return haystack.includes(query);
      });
  }, [codeFilter, keyword, products, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / size));
  const safePage = Math.min(page, totalPages);

  const pagedProducts = useMemo(() => {
    const from = (safePage - 1) * size;
    const to = from + size;
    return filteredProducts.slice(from, to);
  }, [filteredProducts, safePage, size]);

  const pages = useMemo(() => windowedPages(safePage, totalPages), [safePage, totalPages]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const onChangeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const onSaveStatus = async (prodId) => {
    const nextStatus = editableStatus[prodId];
    if (!nextStatus || savingProdId) return;

    setSavingProdId(prodId);
    setActionError('');
    setNotice('');

    try {
      await adminApi.changeProductStatus(prodId, nextStatus);
      setNotice(`상품 #${prodId} 상태가 변경되었습니다.`);
      await refetch();
    } catch (e) {
      setActionError(e?.message || '상품 상태 변경에 실패했습니다.');
    } finally {
      setSavingProdId(null);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>룸서비스 상품</h2>
          <p className={styles.sub}>
            총 <strong>{filteredProducts.length}</strong>개
          </p>
          <p className={styles.hint}>
            데이터 소스: <code>/products</code> (현재 판매중 상품만 조회)
          </p>
        </div>

        <div className={styles.actions}>
          <select
            className={styles.select}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 30, 50].map((optionSize) => (
              <option key={optionSize} value={optionSize}>
                {optionSize}개씩
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={refetch}
            disabled={loading || Boolean(savingProdId)}
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>상태</span>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => onChangeFilter(setStatusFilter)(e.target.value)}
          >
            <option value="all">전체</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>코드</span>
          <select
            className={styles.select}
            value={codeFilter}
            onChange={(e) => onChangeFilter(setCodeFilter)(e.target.value)}
          >
            <option value="all">전체</option>
            {codeOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="ID / 상품명 / 설명 / 제휴사"
            onChange={(e) => onChangeFilter(setKeyword)(e.target.value)}
          />
        </label>

        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            setStatusFilter('all');
            setCodeFilter('all');
            setKeyword('');
            setPage(1);
          }}
        >
          필터 초기화
        </button>
      </div>

      <div className={styles.statusRow} aria-live="polite">
        {loading ? '상품 데이터를 불러오는 중...' : notice}
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

      {!loading && pagedProducts.length === 0 ? (
        <div className={styles.empty}>현재 조건에 맞는 상품이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>상품</th>
                <th>가격</th>
                <th>상태</th>
                <th>코드 / 제휴사</th>
                <th>건물별 재고</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((product) => {
                const stocks = toStockEntries(product.buildingStocks);
                const totalStock = stocks.reduce((sum, item) => sum + item.stock, 0);
                return (
                  <tr key={product.prodId}>
                    <td>
                      <strong>
                        #{product.prodId} {product.prodNm || '-'}
                      </strong>
                      <div className={styles.subCell}>{product.prodDesc || '-'}</div>
                    </td>
                    <td>{formatMoney(product.prodPrice)}</td>
                    <td>
                      <div className={styles.statusCell}>
                        <StatusBadge status={product.prodSt} />
                        <div className={styles.statusActions}>
                          <select
                            className={styles.select}
                            value={editableStatus[product.prodId] ?? product.prodSt ?? ''}
                            onChange={(e) =>
                              setEditableStatus((prev) => ({
                                ...prev,
                                [product.prodId]: e.target.value,
                              }))
                            }
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => onSaveStatus(product.prodId)}
                            disabled={Boolean(savingProdId)}
                          >
                            {savingProdId === product.prodId ? '저장 중...' : '저장'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{product.code || '-'}</div>
                      <div className={styles.subCell}>
                        제휴사 #{product.affiliateId ?? '-'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.stockHead}>총 {totalStock}</div>
                      <div className={styles.stockWrap}>
                        {stocks.length === 0 ? (
                          <span className={styles.stockEmpty}>재고 정보 없음</span>
                        ) : (
                          stocks.map((stock) => (
                            <span
                              key={`${product.prodId}_${stock.buildingId}`}
                              className={styles.stockChip}
                            >
                              건물{stock.buildingId}: {stock.stock}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
          >
            {'<'}
          </button>

          {pages.map((targetPage) => (
            <button
              key={targetPage}
              type="button"
              className={`${styles.pageBtn} ${targetPage === safePage ? styles.pageBtnActive : ''}`}
              onClick={() => setPage(targetPage)}
            >
              {targetPage}
            </button>
          ))}

          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
          >
            {'>'}
          </button>
        </div>
      )}
    </section>
  );
}
