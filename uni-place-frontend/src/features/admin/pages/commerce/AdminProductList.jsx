import React, { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAdminProductList } from '../../hooks/useAdminProducts';
import styles from './AdminProductList.module.css';

const STATUS_OPTIONS = [
  { value: 'on_sale', label: 'On Sale' },
  { value: 'sold_out', label: 'Sold Out' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function formatMoney(value) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')} KRW`;
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
      setNotice(`Product #${prodId} status updated.`);
      await refetch();
    } catch (e) {
      setActionError(e?.message || 'Failed to update product status.');
    } finally {
      setSavingProdId(null);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Room Service Products</h2>
          <p className={styles.sub}>
            Showing <strong>{filteredProducts.length}</strong> items
          </p>
          <p className={styles.hint}>
            Data source: <code>/products</code> (currently on-sale items only)
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
                {optionSize} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={refetch}
            disabled={loading || Boolean(savingProdId)}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>Status</span>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => onChangeFilter(setStatusFilter)(e.target.value)}
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>Code</span>
          <select
            className={styles.select}
            value={codeFilter}
            onChange={(e) => onChangeFilter(setCodeFilter)(e.target.value)}
          >
            <option value="all">All</option>
            {codeOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterItem}>
          <span className={styles.filterLabel}>Search</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="ID / Name / Description / Affiliate"
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
          Reset Filter
        </button>
      </div>

      <div className={styles.statusRow} aria-live="polite">
        {loading ? 'Loading product data...' : notice}
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

      {!loading && pagedProducts.length === 0 ? (
        <div className={styles.empty}>No products found for the current filter.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
                <th>Code / Affiliate</th>
                <th>Building Stock</th>
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
                            {savingProdId === product.prodId ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{product.code || '-'}</div>
                      <div className={styles.subCell}>
                        Affiliate #{product.affiliateId ?? '-'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.stockHead}>Total {totalStock}</div>
                      <div className={styles.stockWrap}>
                        {stocks.length === 0 ? (
                          <span className={styles.stockEmpty}>No stock data</span>
                        ) : (
                          stocks.map((stock) => (
                            <span
                              key={`${product.prodId}_${stock.buildingId}`}
                              className={styles.stockChip}
                            >
                              B{stock.buildingId}: {stock.stock}
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
