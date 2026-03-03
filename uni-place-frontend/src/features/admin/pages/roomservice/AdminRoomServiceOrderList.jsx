import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { useAdminRoomServiceOrders } from '../../hooks/useAdminRoomServiceOrders';
import styles from './AdminRoomServiceOrderList.module.css';

const STATUS_OPTIONS = [
  { value: 'requested', label: '요청됨' },
  { value: 'paid', label: '결제완료' },
  { value: 'delivered', label: '배송완료' },
  { value: 'cancelled', label: '취소됨' },
];

const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

function formatMoney(value) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return '-';
  return `${safe.toLocaleString('ko-KR')}원`;
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
  const [searchParams] = useSearchParams();
  const [size, setSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [focusedOrder, setFocusedOrder] = useState(null);

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

  const searchKey = searchParams.toString();
  const orderIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(searchKey);
    const raw = params.get('orderId');
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? Math.trunc(num) : null;
  }, [searchKey]);

  useEffect(() => {
    let canceled = false;
    async function focusOrder() {
      if (!orderIdFromQuery) {
        setFocusedOrder(null);
        return;
      }

      setKeyword(String(orderIdFromQuery));
      setStatusFilter('all');

      try {
        const order = await adminApi.getRoomServiceOrderById(orderIdFromQuery);
        if (canceled) return;
        setFocusedOrder(order ?? null);
      } catch {
        if (canceled) return;
        setFocusedOrder(null);
      }
    }

    focusOrder();
    return () => {
      canceled = true;
    };
  }, [orderIdFromQuery]);

  const sourceOrders = useMemo(
    () => (focusedOrder ? [focusedOrder] : orders),
    [focusedOrder, orders]
  );

  useEffect(() => {
    const next = {};
    sourceOrders.forEach((order) => {
      next[order.orderId] = order.orderSt ?? 'requested';
    });
    setEditableStatus(next);
  }, [sourceOrders]);

  const filteredOrders = useMemo(() => {
    if (focusedOrder) return [focusedOrder];

    const query = keyword.trim().toLowerCase();
    return sourceOrders.filter((order) => {
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
  }, [focusedOrder, keyword, sourceOrders, statusFilter]);

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
      setNotice(`주문 #${orderId} 상태가 변경되었습니다.`);
      if (focusedOrder && Number(focusedOrder.orderId) === Number(orderId)) {
        const refreshed = await adminApi.getRoomServiceOrderById(orderId);
        setFocusedOrder(refreshed ?? null);
      } else {
        await refetch();
      }
    } catch (e) {
      setActionError(e?.message || '주문 상태 변경에 실패했습니다.');
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>룸서비스 주문내역</h2>
          <p className={styles.sub}>
            총 <strong>{pagination.totalElements}</strong>건
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
                {optionSize}개씩
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={refetch}
            disabled={loading || Boolean(savingOrderId)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
          <span className={styles.filterLabel}>검색</span>
          <input
            className={styles.input}
            value={keyword}
            placeholder="주문번호 / 사용자ID / 객실 / 메모"
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
          필터 초기화
        </button>
      </div>

      <div className={styles.statusRow} aria-live="polite">
        {loading ? '주문 데이터를 불러오는 중...' : notice}
      </div>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

      {!loading && filteredOrders.length === 0 ? (
        <div className={styles.empty}>현재 조건에 맞는 주문이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>주문</th>
                <th>사용자 / 객실</th>
                <th>금액</th>
                <th>상태</th>
                <th>요청일시</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <strong>#{order.orderId}</strong>
                    <div className={styles.subCell}>
                      연결 주문 #{order.parentOrderId ?? '-'}
                    </div>
                  </td>
                  <td>
                    <div>{order.userId || '-'}</div>
                    <div className={styles.subCell}>
                      객실 {order.roomNo ?? '-'} (ID {order.roomId ?? '-'})
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
                          {savingOrderId === order.orderId ? '저장 중...' : '저장'}
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
