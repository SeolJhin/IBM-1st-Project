import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

function formatPaymentProvider(provider) {
  const key = String(provider ?? '')
    .trim()
    .toLowerCase();
  if (!key) return '-';
  if (key.includes('kakao')) return '카카오페이';
  if (key.includes('toss')) return '토스페이';
  if (key.includes('naver')) return '네이버페이';
  if (key.includes('card') || key === 'iamport') return '카드';
  return provider;
}

function resolvePaymentProvider(order) {
  const provider =
    order?.paymentProvider ??
    order?.provider ??
    order?.paymentMethodNm ??
    order?.paymentMethodCd ??
    null;
  if (provider) return provider;
  const st = String(order?.parentOrderSt ?? order?.orderSt ?? '').toLowerCase();
  if (st === 'ordered' || st === 'requested') return 'card';
  return null;
}

function isPaymentCompleted(order) {
  const paymentSt = String(order?.paymentSt ?? '')
    .trim()
    .toLowerCase();
  const orderSt = String(order?.orderSt ?? '')
    .trim()
    .toLowerCase();
  const parentOrderSt = String(order?.parentOrderSt ?? '')
    .trim()
    .toLowerCase();
  return paymentSt === 'paid' || orderSt === 'paid' || parentOrderSt === 'paid';
}

function getDisplayStatus(order) {
  const raw = String(order?.orderSt ?? '')
    .trim()
    .toLowerCase();
  const paymentSt = String(order?.paymentSt ?? '')
    .trim()
    .toLowerCase();

  if (raw === 'cancelled') return 'cancelled';
  if (raw === 'delivered') return 'delivered';

  // 결제 완료
  if (isPaymentCompleted(order)) return 'paid';

  // 결제 취소/실패/미완료(QR 뜨고 결제 안 함) → 모두 취소됨
  if (
    paymentSt === 'cancelled' ||
    paymentSt === 'failed' ||
    paymentSt === 'pending' ||
    paymentSt === 'ready'
  )
    return 'cancelled';

  // 카드(현장) 결제 등 결제 수단 없이 요청됨
  return 'requested';
}

function windowedPages(currentPage, totalPages, radius = 2) {
  const pages = [];
  const from = Math.max(1, currentPage - radius);
  const to = Math.min(totalPages, currentPage + radius);
  for (let page = from; page <= to; page += 1) pages.push(page);
  return pages;
}

async function fetchAllPages(fetchPage) {
  let page = 1;
  let totalPages = 1;
  const rows = [];

  while (page <= totalPages) {
    const res = await fetchPage(page);
    const content = Array.isArray(res?.content) ? res.content : [];
    rows.push(...content);

    const nextTotal = Number(res?.totalPages ?? 1);
    totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? nextTotal : 1;
    page += 1;
  }

  return rows;
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
          : key === 'payment_pending'
            ? styles.badgePaymentPending
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
  const [roomLabelByRoomId, setRoomLabelByRoomId] = useState({});

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

  const loadRoomLabels = useCallback(async () => {
    try {
      const [rooms, buildings] = await Promise.all([
        fetchAllPages((page) =>
          adminApi.getRooms({ page, size: 200, sort: 'roomId', direct: 'ASC' })
        ),
        fetchAllPages((page) =>
          adminApi.getBuildings({
            page,
            size: 200,
            sort: 'buildingId',
            direct: 'ASC',
          })
        ),
      ]);

      const buildingNameById = new Map(
        buildings.map((b) => [
          Number(b?.buildingId),
          String(
            b?.buildingName ??
              b?.buildingNm ??
              b?.name ??
              `건물 ${b?.buildingId ?? '-'}`
          ),
        ])
      );

      const mapped = {};
      rooms.forEach((room) => {
        const roomId = Number(room?.roomId);
        if (!Number.isFinite(roomId)) return;
        const buildingName =
          buildingNameById.get(Number(room?.buildingId)) || '건물 미확인';
        const roomNo = room?.roomNo ?? '-';
        mapped[roomId] = `${buildingName} / ${roomNo} 호실`;
      });

      setRoomLabelByRoomId(mapped);
    } catch {
      setRoomLabelByRoomId({});
    }
  }, []);

  useEffect(() => {
    loadRoomLabels();
  }, [loadRoomLabels]);

  // 10초마다 자동 새로고침 — useRef로 최신 refetch 추적 (클로저 문제 방지)
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  useEffect(() => {
    const id = setInterval(() => {
      refetchRef.current();
    }, 10000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      // displayStatus 기반 필터
      if (statusFilter !== 'all') {
        const ds = getDisplayStatus(order);
        if (ds !== statusFilter) return false;
      }

      if (!query) return true;

      const haystack = [
        order.orderId,
        order.parentOrderId,
        order.userId,
        order.roomNo,
        order.roomId,
        roomLabelByRoomId[Number(order.roomId)],
        order.roomServiceDesc,
      ]
        .map((item) => String(item ?? '').toLowerCase())
        .join(' ');

      return haystack.includes(query);
    });
  }, [focusedOrder, keyword, sourceOrders, statusFilter, roomLabelByRoomId]);

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
      {actionError ? (
        <div className={styles.errorBox}>{actionError}</div>
      ) : null}

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
                  {/*
                    Prefer "건물명 / 호실" if room metadata is available.
                    Fallback to order payload roomNo when room lookup is missing.
                  */}
                  {(() => {
                    const roomLabel =
                      roomLabelByRoomId[Number(order.roomId)] ||
                      `건물 미확인 / ${order.roomNo ?? '-'} 호실`;
                    return (
                      <>
                        <td>
                          <strong>#{order.orderId}</strong>
                          <div className={styles.subCell}>
                            연결 주문 #{order.parentOrderId ?? '-'}
                          </div>
                        </td>
                        <td>
                          <div>{order.userId || '-'}</div>
                          <div className={styles.subCell}>{roomLabel}</div>
                        </td>
                        <td>
                          <div>{formatMoney(order.totalPrice)}</div>
                          <div className={styles.subCell}>
                            결제수단:{' '}
                            {formatPaymentProvider(
                              resolvePaymentProvider(order)
                            )}
                          </div>
                          <div className={styles.subCell}>
                            {isPaymentCompleted(order) ? '결제완료' : '요청됨'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <StatusBadge status={getDisplayStatus(order)} />
                            <div className={styles.statusActions}>
                              <select
                                className={styles.select}
                                value={
                                  editableStatus[order.orderId] ??
                                  order.orderSt ??
                                  ''
                                }
                                onChange={(e) =>
                                  setEditableStatus((prev) => ({
                                    ...prev,
                                    [order.orderId]: e.target.value,
                                  }))
                                }
                              >
                                {STATUS_OPTIONS.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
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
                                {savingOrderId === order.orderId
                                  ? '저장 중...'
                                  : '저장'}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>{order.roomServiceDesc || '-'}</td>
                      </>
                    );
                  })()}
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
              goToPage(
                Math.min(pagination.totalPages, pagination.currentPage + 1)
              )
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
