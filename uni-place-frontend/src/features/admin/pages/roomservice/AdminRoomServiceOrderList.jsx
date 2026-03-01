import React, { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import { useAdminRoomServiceOrders } from '../../hooks/useAdminRoomServiceOrders';
import styles from './AdminRoomServiceOrderList.module.css';

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested' },
  { value: 'paid', label: 'Paid' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatMoney(value) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')} KRW`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
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
  const className =
    key === 'delivered'
      ? styles.badgeDelivered
      : key === 'paid'
        ? styles.badgePaid
        : key === 'cancelled'
          ? styles.badgeCancelled
          : styles.badgeRequested;

  return (
    <span className={`${styles.badge} ${className}`}>
      {STATUS_LABELS[key] ?? status ?? '-'}
    </span>
  );
}

export default function AdminRoomServiceOrderList() {
  const [size, setSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');

  const [editableStatus, setEditableStatus] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const { orders, pagination, loading, error, goToPage, refetch } =
    useAdminRoomServiceOrders({
      initialPage: 1,
      size,
      sort: 'createdAt,DESC',
    });

  useEffect(() => {
    const next = {};
    orders.forEach((order) => {
      next[order.orderId] = order.orderSt ?? 'requested';
    });
    setEditableStatus(next);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.orderSt !== statusFilter) return false;
      if (!query) return true;

      const haystack = [
        order.orderId,
        order.parentOrderId,
        order.userId,
        order.roomNo,
        order.roomId,
        order.roomServiceDesc,
      ]
        .map((item) => String(item ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }, [keyword, orders, statusFilter]);

  const pages = useMemo(
    () => windowedPages(pagination.currentPage, pagination.totalPages),
    [pagination.currentPage, pagination.totalPages]
  );

  const onSaveStatus = async (orderId) => {
    const nextStatus = editableStatus[orderId];
    if (!nextStatus || savingOrderId) return;

    setSavingOrderId(orderId);
    setActionError('');
    setNotice('');

    try {
      await adminApi.updateRoomServiceOrderStatus(orderId, {
        orderSt: nextStatus,
      });
      setNotice(`Order #${orderId} status updated.`);
      await refetch();
    } catch (e) {
      setActionError(e?.message || 'Failed to update order status.');
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Room Service Orders</h2>
          <p className={styles.sub}>
            Total <strong>{pagination.totalElements}</strong> orders
          </p>
        </div>

        <div className={styles.actions}>
          <select
            className={styles.select}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setActionError('');
              setNotice('');
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
            disabled={loading || Boolean(savingOrderId)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
          <span className={styles.filterLabel}>Search</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="Order ID / User ID / Room / Memo"
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>

        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            setStatusFilter('all');
            setKeyword('');
          }}
        >
          Reset Filter
        </button>
      </div>

      <div className={styles.statusRow} aria-live="polite">
        {loading ? 'Loading order data...' : notice}
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

      {!loading && filteredOrders.length === 0 ? (
        <div className={styles.empty}>No orders found for the current filter.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>User / Room</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Memo</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <strong>#{order.orderId}</strong>
                    <div className={styles.subCell}>
                      Parent #{order.parentOrderId ?? '-'}
                    </div>
                  </td>
                  <td>
                    <div>{order.userId || '-'}</div>
                    <div className={styles.subCell}>
                      Room {order.roomNo ?? '-'} (ID {order.roomId ?? '-'})
                    </div>
                  </td>
                  <td>{formatMoney(order.totalPrice)}</td>
                  <td>
                    <div className={styles.statusCell}>
                      <StatusBadge status={order.orderSt} />
                      <div className={styles.statusActions}>
                        <select
                          className={styles.select}
                          value={editableStatus[order.orderId] ?? order.orderSt ?? ''}
                          onChange={(e) =>
                            setEditableStatus((prev) => ({
                              ...prev,
                              [order.orderId]: e.target.value,
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
                          onClick={() => onSaveStatus(order.orderId)}
                          disabled={Boolean(savingOrderId)}
                        >
                          {savingOrderId === order.orderId ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td>{order.roomServiceDesc || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => goToPage(Math.max(1, pagination.currentPage - 1))}
            disabled={pagination.currentPage <= 1 || loading}
          >
            {'<'}
          </button>

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`${styles.pageBtn} ${page === pagination.currentPage ? styles.pageBtnActive : ''}`}
              onClick={() => goToPage(page)}
              disabled={loading}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className={styles.pageBtn}
            onClick={() =>
              goToPage(Math.min(pagination.totalPages, pagination.currentPage + 1))
            }
            disabled={
              pagination.currentPage >= pagination.totalPages || loading
            }
          >
            {'>'}
          </button>
        </div>
      )}
    </section>
  );
}
